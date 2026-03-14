import "@supabase/functions-js/edge-runtime.d.ts";

import { ArticleWebhookPayload } from "./types.ts";
import { generateArticleSummary, getEmbeddingBySummary } from "./gemini.ts";
import * as supabase from "./supabase.ts";
import { toPgVector } from "./utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: supabase.corsHeaders });
  }
  try {
    const payload: ArticleWebhookPayload = await req.json();

    if (payload.type !== "INSERT") {
      // TODO: Respond with the right code for unused events (Unnecessary event but Supabase Webhook always sends the event to this function)
      return new Response();
    }

    const record = payload.record;

    console.log("Received article record:", record);

    const htmlResponse = await fetch(record.url);
    const htmlContent = await htmlResponse.text();

    const plainText = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 8192); // Limit to 8192 characters for gemini-embedding-2-preview (Japanese characters seem to require more bytes, (1.5 character = 1 token tested in the official Gemini API playground))

    const language = "ja"; // FIXME: Currently hardcoded to Japanese, but ideally should be determined dynamically based on the user locale
    const summary = await generateArticleSummary(plainText, language);
    if (!summary) {
      throw new Error("Failed to generate summary: " + record.url);
    }

    const embedding = await getEmbeddingBySummary(summary);
    if (!embedding) {
      throw new Error("Failed to generate embedding: " + record.url);
    }

    const embeddingString = toPgVector(embedding);
    await supabase.updateArticle(record.id, summary, embeddingString);
    await supabase.createArticleConnections(
      record.id,
      record.user_id,
      embeddingString,
    );

    console.log(`Successfully processed and linked article: ${record.id}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error processing article:", error);
    return new Response(JSON.stringify({ "error": error }), {
      headers: { ...supabase.corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
