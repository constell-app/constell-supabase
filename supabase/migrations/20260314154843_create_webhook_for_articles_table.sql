CREATE TRIGGER "webhook_for_articles_table" AFTER INSERT
ON "public"."articles" FOR EACH ROW
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'http://host.docker.internal:3000',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);