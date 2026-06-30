-- SQL Schema for Community Hero Supabase Migration

-- Enable pgcrypto for UUID generation if needed, though we can use custom IDs matching the current application structure (e.g. 'usr-', 'iss-', etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- matches usr-xxxx
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    points INTEGER NOT NULL DEFAULT 100 CHECK (points >= 0),
    avatar TEXT,
    reported_count INTEGER NOT NULL DEFAULT 0,
    resolved_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ISSUES TABLE
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY, -- matches iss-xxxx
    reporter_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    reporter_avatar TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'duplicate')),
    image TEXT, -- Holds the Base64 data OR Supabase public storage URL
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    address TEXT NOT NULL,
    department TEXT NOT NULL,
    urgency TEXT,
    precautions TEXT,
    estimated_resolution TEXT,
    duplicate_of TEXT REFERENCES issues(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    assigned_to TEXT,
    resolution_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, -- com-xxxx
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REWARDS STORE TABLE
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY, -- rew-xxxx
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY, -- red-xxxx
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES rewards(id) ON DELETE CASCADE,
    item_title TEXT NOT NULL,
    points_spent INTEGER NOT NULL CHECK (points_spent >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, -- not-xxxx
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('reward', 'status_change', 'comment')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOTES TABLE
CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (issue_id, user_id)
);

-- VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (issue_id, user_id)
);

-- ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY, -- log-xxxx
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES FOR FAST QUERY RESOLUTION
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_issue_id ON votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_verifications_issue_id ON verifications(issue_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- CREATE GENERAL PERMISSIVE POLICIES FOR ALL ROLES FOR THE API SERVER TO MANAGE
-- Since our Express.js backend serves as a proxy and manages authentication and authorization via JWT,
-- we define policies allowing read/write operations for service roles or general authenticated profiles.
CREATE POLICY "Allow public read-access to departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read-access to profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual profile management" ON profiles FOR ALL USING (true);

CREATE POLICY "Allow public read-access to issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Allow authenticated issue creation" ON issues FOR ALL USING (true);

CREATE POLICY "Allow public read-access to comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated comment creation" ON comments FOR ALL USING (true);

CREATE POLICY "Allow public read-access to rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Allow admin rewards management" ON rewards FOR ALL USING (true);

CREATE POLICY "Allow users to see their redemptions" ON redemptions FOR ALL USING (true);
CREATE POLICY "Allow users to see their notifications" ON notifications FOR ALL USING (true);

CREATE POLICY "Allow votes operations" ON votes FOR ALL USING (true);
CREATE POLICY "Allow verifications operations" ON verifications FOR ALL USING (true);
CREATE POLICY "Allow activity logging" ON activity_logs FOR ALL USING (true);

-- GRANTS FOR SUPABASE API ROLES
-- RLS policies decide row-level access, but PostgREST roles still need schema/table privileges.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ENABLE REALTIME FOR CORRESPONDING TABLES
-- In Supabase, we enable realtime by adding the tables to the supabase_realtime publication
alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table profiles;

-- INITIAL SEED DATA FOR REWARDS CATALOGUE
INSERT INTO rewards (id, title, description, points_cost, category, image, stock) VALUES
('rew-transit', '1-Month Public Transit Pass', 'Get unlimited access to city buses, metros, and light rail for 30 days. Save money and lower carbon footprint!', 400, 'Transit', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=60', 15),
('rew-coffee', 'Free Local Cafe Beverage', 'Redeem a free premium hot or iced drink at any participating neighborhood coffee shop or bakery.', 120, 'Voucher', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60', 50),
('rew-park', 'National Park Day Pass', 'Explore breathtaking nature with a single-day vehicle entry pass to any federal state park or reservation.', 250, 'Experience', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300&auto=format&fit=crop&q=60', 25),
('rew-compost', 'Home Composting Kit', 'Complete organic waste starter kit with bin, soil conditioner, and biodegradable bags for backyard ecology.', 350, 'Eco-Goods', 'https://images.unsplash.com/photo-1621447508373-1f12e7024952?w=300&auto=format&fit=crop&q=60', 8)
ON CONFLICT (id) DO NOTHING;

-- INITIAL SEED DATA FOR DEPARTMENTS
INSERT INTO departments (id, name) VALUES
('dept-dpw', 'Department of Public Works'),
('dept-rco', 'Road Commission & Transit Authority'),
('dept-wsm', 'Waste & Sanitation Management'),
('dept-prd', 'Parks, Recreation & Forestry')
ON CONFLICT (id) DO NOTHING;
