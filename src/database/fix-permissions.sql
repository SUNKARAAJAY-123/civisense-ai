-- Run this in the Supabase SQL Editor if the app reports:
-- "permission denied for table profiles"

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-access to profiles" ON profiles;
CREATE POLICY "Allow public read-access to profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual profile management" ON profiles;
CREATE POLICY "Allow individual profile management" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-access to issues" ON issues;
CREATE POLICY "Allow public read-access to issues" ON issues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated issue creation" ON issues;
CREATE POLICY "Allow authenticated issue creation" ON issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-access to comments" ON comments;
CREATE POLICY "Allow public read-access to comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated comment creation" ON comments;
CREATE POLICY "Allow authenticated comment creation" ON comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-access to rewards" ON rewards;
CREATE POLICY "Allow public read-access to rewards" ON rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin rewards management" ON rewards;
CREATE POLICY "Allow admin rewards management" ON rewards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to see their redemptions" ON redemptions;
CREATE POLICY "Allow users to see their redemptions" ON redemptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to see their notifications" ON notifications;
CREATE POLICY "Allow users to see their notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow votes operations" ON votes;
CREATE POLICY "Allow votes operations" ON votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow verifications operations" ON verifications;
CREATE POLICY "Allow verifications operations" ON verifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-access to departments" ON departments;
CREATE POLICY "Allow public read-access to departments" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow activity logging" ON activity_logs;
CREATE POLICY "Allow activity logging" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
