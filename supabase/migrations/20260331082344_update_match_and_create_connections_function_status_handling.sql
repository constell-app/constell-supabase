CREATE OR REPLACE FUNCTION match_and_create_connections(
  target_id uuid,
  target_embedding vector(3072),
  target_user uuid,
  match_threshold float
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO article_connections (user_id, source_article_id, target_article_id, similarity_score)
  SELECT
    target_user,
    target_id,
    articles.id AS target_article_id,
    1 - (articles.embedding <=> target_embedding) AS similarity_score
  FROM articles
  WHERE
    articles.user_id = target_user
    AND articles.id != target_id
    AND 1 - (articles.embedding <=> target_embedding) >= match_threshold
  ON CONFLICT (source_article_id, target_article_id) DO NOTHING;

  UPDATE articles
  SET status = "completed"
  WHERE id = target_id;
END;
$$;