-- Additive M9 migration. Existing TTL, RLS and cleanup contract are preserved.
update storage.buckets set file_size_limit=4000000
where id='photobooth-shares';
