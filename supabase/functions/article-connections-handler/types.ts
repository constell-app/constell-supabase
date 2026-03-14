import { Tables } from "$generated/database.types.ts";

// Type definitions for table rows
export type ArticleRow = Tables<"articles">;
export type ArticleConnectionRow = Tables<"article_connections">;

// Type definitions related to webhook payloads
export type WebhookOperation = "INSERT" | "UPDATE" | "DELETE";

export type InsertPayload<T> = {
  type: "INSERT";
  table: string;
  schema: string;
  record: T;
  old_record: null;
};

export type UpdatePayload<T> = {
  type: "UPDATE";
  table: string;
  schema: string;
  record: T;
  old_record: T;
};

export type DeletePayload<T> = {
  type: "DELETE";
  table: string;
  schema: string;
  record: null;
  old_record: T;
};

export type WebhookPayload<T> =
  | InsertPayload<T>
  | UpdatePayload<T>
  | DeletePayload<T>;

export type ArticleWebhookPayload = WebhookPayload<ArticleRow>;
export type ArticleConnectionWebhookPayload = WebhookPayload<
  ArticleConnectionRow
>;
