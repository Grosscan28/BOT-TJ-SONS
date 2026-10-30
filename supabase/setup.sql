-- Run this file once in the Supabase SQL Editor before signing in.
-- Existing rows are preserved. App data is accessible only through the server.
BEGIN;
CREATE TABLE IF NOT EXISTS audit (
	id text PRIMARY KEY NOT NULL,
	actor text NOT NULL,
	record_id text NOT NULL,
	action text NOT NULL,
	details text DEFAULT '' NOT NULL,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
	id text PRIMARY KEY NOT NULL,
	record_id text NOT NULL,
	name text NOT NULL,
	mime text NOT NULL,
	size integer NOT NULL,
	category text NOT NULL,
	area text DEFAULT '' NOT NULL,
	uploaded_by text NOT NULL,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
	id text PRIMARY KEY NOT NULL,
	email text NOT NULL,
	name text NOT NULL,
	role text NOT NULL,
	phone text DEFAULT '' NOT NULL,
	active integer DEFAULT 1 NOT NULL,
	created_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique ON members (email);
CREATE TABLE IF NOT EXISTS notifications (
	id text PRIMARY KEY NOT NULL,
	member_id text NOT NULL,
	record_id text NOT NULL,
	title text NOT NULL,
	body text NOT NULL,
	read integer DEFAULT 0 NOT NULL,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
	id text PRIMARY KEY NOT NULL,
	record_id text NOT NULL,
	member_id text NOT NULL,
	status text NOT NULL,
	message text NOT NULL,
	provider_id text,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
	id text PRIMARY KEY NOT NULL,
	kind text NOT NULL,
	data text NOT NULL,
	version integer DEFAULT 1 NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS records_kind_idx ON records (kind);
ALTER TABLE public.audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit FROM anon, authenticated;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.files FROM anon, authenticated;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.members FROM anon, authenticated;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;

ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.outbox FROM anon, authenticated;

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.records FROM anon, authenticated;

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('tj-sons-files','tj-sons-files',false,4194304,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=4194304, allowed_mime_types=EXCLUDED.allowed_mime_types;
COMMIT;
