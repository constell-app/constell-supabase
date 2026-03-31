SELECT cron.schedule(
  'cleanup-stale-articles',
  '*/10 * * * *', -- 10分毎
  $$
  UPDATE articles
  SET status = 'error'
  WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '10 minutes';
  $$
);