create extension if not exists "pg_net" with schema "extensions";

CREATE TRIGGER articles_table AFTER INSERT ON public.articles FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://bmylggxjtskzmroxiedh.supabase.co/functions/v1/article-connections-handler', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteWxnZ3hqdHNrem1yb3hpZWRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIzOTMzNiwiZXhwIjoyMDg3ODE1MzM2fQ.fjtfitKEGOEOXRHnwLrSPPzhQUebzZnvqa7XLt25UZc"}', '{}', '5000');


