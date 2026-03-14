import { createClient } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";
import { corsHeaders as defaultCorsHeaders } from "@supabase/supabase-js/cors";

import type { Database } from "$generated/database.types.ts";
import { ArticleSummary } from "./gemini.ts";

export const corsHeaders = defaultCorsHeaders;

const adminClient = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * Update the article record in the "articles" table with the extracted data and embedding vector.
 *
 * @param id An article ID to update the record in the "articles" table.
 * @param summary The structured data extracted from the article content, including the title, summary, and tags, which will be stored in the corresponding columns of the "articles" table.
 * @param embedding The embedding vector generated from the article summary, which will be stored in the "embedding" column of the "articles" table.
 * @throws - {@link PostgrestError} If the update operation fails, the error from Supabase will be thrown.
 */
export async function updateArticle(
  id: string,
  summary: ArticleSummary,
  embedding: string,
) {
  const { error: updateError } = await adminClient
    .from("articles")
    .update({
      title: summary.title,
      summary: summary.summary,
      tags: summary.tags,
      embedding: embedding,
    })
    .eq("id", id);

  if (updateError) {
    throw updateError;
  }
}

/**
 * Create connections between the newly processed article and existing articles in the "articles" table based on the similarity of their embedding vectors. This function calls a stored procedure named "match_and_create_connections" in the Supabase database, which performs the following operations:
 * @param id The ID of the newly processed article for which connections will be created. This ID is used as the "target_id" parameter in the stored procedure to identify the article record in the database.
 * @param userId  The ID of the user who owns the article. This is used as the "target_user" parameter in the stored procedure to ensure that connections are created only between articles owned by the same user.
 * @param embedding  The embedding vector of the newly processed article, which is used as the "target_embedding" parameter in the stored procedure to calculate the similarity with existing articles' embeddings and determine which connections to create based on the specified "match_threshold".
 * @throws - {@link PostgrestError} If the RPC call to the stored procedure fails, the error from Supabase will be thrown.
 */
export async function createArticleConnections(
  id: string,
  userId: string,
  embedding: string,
) {
  const { error } = await adminClient.rpc(
    "match_and_create_connections",
    {
      target_id: id,
      target_embedding: embedding,
      target_user: userId,
      match_threshold: 0.75,
    },
  );

  if (error) {
    throw error;
  }
}
