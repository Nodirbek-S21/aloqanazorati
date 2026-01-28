
-- 1. Users jadvali
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT,
    "branchId" TEXT,
    "createdAt" TEXT,
    "isApproved" BOOLEAN DEFAULT TRUE
);

-- 2. Reports jadvali
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    "operatorId" TEXT,
    "operatorName" TEXT,
    "branchId" TEXT,
    timestamp TEXT,
    "leadId" TEXT,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "visitStatus" TEXT,
    "tasksCompleted" TEXT,
    "callDuration" TEXT,
    status TEXT
);

-- 3. Leads jadvali
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    surname TEXT,
    school TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new',
    "assignedTo" TEXT
);

-- Ruxsatlarni yoqish (Row Level Security - RLS)
-- Test rejimida barcha ruxsatlarni ochib qo'yamiz
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
