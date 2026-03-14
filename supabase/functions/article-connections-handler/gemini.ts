import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

const articleSummary = z.object({
  title: z.string().min(1).max(50),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string().min(1).max(20)).max(5),
});
export type ArticleSummary = z.infer<typeof articleSummary>;

/**
 * Generate an article summary using Gemini AI.
 *
 * @param articleContent The raw text content of the article to be summarized.
 * @param model The Gemini model to use for content generation (e.g., "gemini-3.1-flash-lite-preview").
 * @param language ISO 639-1 language code of the summarized article content (e.g., "en" for English, "ja" for Japanese).
 * @returns An object containing the article title, summary, and tags, or null if an error occurs.
 * @see https://ai.google.dev/gemini-api/docs/models for available Gemini models.
 */
export async function generateArticleSummary(
  articleContent: string,
  language: string,
  model: string = "gemini-3.1-flash-lite-preview",
): Promise<ArticleSummary | null> {
  try {
    const prompt = _getPromptByLanguage(articleContent, language);
    const response = await ai.models.generateContent({
      contents: prompt,
      model: model,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: articleSummary.toJSONSchema(),
        candidateCount: 1,
      },
    });

    if (!response.text) {
      return null;
    }

    const result = articleSummary.parse(JSON.parse(response.text));
    return result;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error);
    } else {
      console.error("Error generating content:", error);
    }
    return null;
  }
}

/**
 * The prompt templates for supported languages.
 *
 * @param content The raw text content of the article to be summarized.
 * @param language ISO 639-1 language code (e.g., "en" for English, "ja" for Japanese).
 * @returns A prompt string tailored to the specified language, or a default English prompt if the language is not supported.
 */
function _getPromptByLanguage(content: string, language: string) {
  const prompts: Record<string, string> = {
    "en": `
    Please extract the title (up to 50 words), a summary (up to 500 words), and relevant category tags (up to 5) from the following web page content.
    Output only in the following JSON format: { "title": "Article Title", "summary": "Summary...", "tags": ["Tag1", "Tag2", "Tag3"] }
    Here is the page content.
    ${content}
    `,
    "ja": `
    以下のWebページ本文から、タイトル（50字以内）、要約（500字以内）、関連するカテゴリタグ（最大5個）を抽出してください。
    必ず以下のJSON形式のみで出力してください。{ "title": "記事のタイトル", "summary": "要約文...", "tags": ["タグ1", "タグ2", "タグ3"] }
    Webページ本文は以下の通りです。
    ${content}
    `,
  };
  return prompts[language] || prompts["en"];
}

/**
 * Generate an embedding vector from the article summary using Gemini AI.
 *
 * @param summary The article summary object containing the title, summary, and tags.
 * @param model The Gemini embedding model to use (e.g., "gemini-embedding-2-preview").
 * @returns An array of numbers representing the embedding vector, or null if an error occurs.
 */
export async function getEmbeddingBySummary(
  summary: ArticleSummary,
  model: string = "gemini-embedding-2-preview",
): Promise<number[] | null> {
  const text = `
  Title: ${summary.title}
  Summary: ${summary.summary}
  Tags: ${summary.tags.join(", ")}
  `;

  const response = await ai.models.embedContent({
    contents: text,
    model: model,
    config: {
      outputDimensionality: 3072,
    },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error("No embeddings returned from the model.");
  }

  const embeddingVector = response.embeddings[0].values ?? null;
  return embeddingVector;
}
