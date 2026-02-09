-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_actions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_name character varying NOT NULL,
  action_type character varying NOT NULL CHECK (action_type::text = ANY (ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying]::text[])),
  table_name character varying NOT NULL,
  record_id character varying NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL,
  subject character varying NOT NULL,
  message text NOT NULL,
  status character varying DEFAULT 'unread'::character varying CHECK (status::text = ANY (ARRAY['unread'::character varying, 'read'::character varying, 'replied'::character varying, 'archived'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'enrolled'::enrollment_status,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  collected_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT course_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT fk_course_enrollments_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.course_statuses (
  id integer NOT NULL DEFAULT nextval('course_statuses_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  display_name character varying,
  variant character varying DEFAULT 'outline'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT course_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.course_types (
  id integer NOT NULL DEFAULT nextval('course_types_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  display_name character varying,
  variant character varying DEFAULT 'outline'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT course_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  course_type_id integer,
  course_type character varying,
  status_id integer,
  status character varying,
  start_date date,
  end_date date,
  link character varying,
  image_url character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  field_of_interest_id integer,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_course_type_id_fkey FOREIGN KEY (course_type_id) REFERENCES public.course_types(id),
  CONSTRAINT courses_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.course_statuses(id),
  CONSTRAINT courses_field_of_interest_id_fkey FOREIGN KEY (field_of_interest_id) REFERENCES public.field_of_interest_options(id)
);
CREATE TABLE public.event_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT event_tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  description text,
  date timestamp with time zone NOT NULL,
  location character varying,
  image_url text,
  attendees integer DEFAULT 0,
  max_attendees integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  time time without time zone,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.field_of_interest_options (
  id integer NOT NULL DEFAULT nextval('field_of_interest_options_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT field_of_interest_options_pkey PRIMARY KEY (id)
);
CREATE TABLE public.magazine_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  magazine_id uuid,
  access_type character varying DEFAULT 'full'::character varying,
  granted_by uuid,
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT magazine_access_pkey PRIMARY KEY (id),
  CONSTRAINT magazine_access_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.magazines(id),
  CONSTRAINT magazine_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id),
  CONSTRAINT magazine_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.magazine_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  magazine_id uuid,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  message text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT magazine_requests_pkey PRIMARY KEY (id),
  CONSTRAINT magazine_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT magazine_requests_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.magazines(id),
  CONSTRAINT magazine_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.magazines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  cover_image_url text,
  pdf_url text,
  authors jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  price numeric DEFAULT 0,
  is_paid boolean DEFAULT false,
  status character varying DEFAULT 'coming_soon'::character varying CHECK (status::text = ANY (ARRAY['coming_soon'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT magazines_pkey PRIMARY KEY (id),
  CONSTRAINT magazines_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL,
  otp_code character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  total_members integer NOT NULL DEFAULT 0,
  events_hosted integer NOT NULL DEFAULT 0,
  research_projects integer NOT NULL DEFAULT 0,
  success_rate character varying NOT NULL DEFAULT ''::character varying,
  contact_email character varying NOT NULL DEFAULT ''::character varying,
  contact_phone character varying NOT NULL DEFAULT ''::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  device_type USER-DEFINED DEFAULT 'unknown'::device_type,
  device_name character varying,
  ip_address inet,
  user_agent text,
  location_country character varying,
  location_city character varying,
  status USER-DEFINED DEFAULT 'active'::session_status,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  full_name character varying NOT NULL,
  field_of_interest character varying,
  role USER-DEFINED DEFAULT 'Member'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- =====================================
-- Enable Row Level Security on storage
-- =====================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 1️⃣ Admin: CREATE / INSERT (upload)
-- =====================================
CREATE POLICY "Admins can upload magazines"
ON storage.objects
FOR INSERT
USING (
    bucket_id = 'Magazines'
);

-- =====================================
-- 2️⃣ Admin: UPDATE / EDIT
-- =====================================
CREATE POLICY "Admins can edit magazines"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'Magazines'
);

-- =====================================
-- 3️⃣ Admin: DELETE
-- =====================================
CREATE POLICY "Admins can delete magazines"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'Magazines'
);

-- =====================================
-- 4️⃣ Public: READ
-- =====================================
-- Optional: bucket is public, so reading works anyway
-- But you can enforce it explicitly for clarity
CREATE POLICY "Public can read magazines"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'Magazines'
);


-- =====================================
-- Admin: INSERT (upload images)
-- =====================================
CREATE POLICY "Admins can insert magazine images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'MagazineImages'
);

-- =====================================
-- Admin: UPDATE (edit)
-- =====================================
CREATE POLICY "Admins can update magazine images"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'MagazineImages'
);

-- =====================================
-- Admin: DELETE
-- =====================================
CREATE POLICY "Admins can delete magazine images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'MagazineImages'
);

-- =====================================
-- Public: READ images
-- =====================================
CREATE POLICY "Public can read magazine images"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'MagazineImages'
);
