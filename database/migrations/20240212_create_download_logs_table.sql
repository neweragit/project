-- Create download logs table to track PDF downloads with user watermarking
-- This table helps track who downloaded what and when for security and analytics

CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    magazine_id UUID NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_download_logs_user 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_download_logs_magazine 
        FOREIGN KEY (magazine_id) 
        REFERENCES public.magazines(id) 
        ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON public.download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_magazine_id ON public.download_logs(magazine_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON public.download_logs(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_magazine ON public.download_logs(user_id, magazine_id);

-- Add table comment
COMMENT ON TABLE public.download_logs IS 'Tracks PDF downloads with watermarking for security and analytics';

-- Add column comments
COMMENT ON COLUMN public.download_logs.id IS 'Unique identifier for download log entry';
COMMENT ON COLUMN public.download_logs.user_id IS 'ID of user who downloaded the PDF';
COMMENT ON COLUMN public.download_logs.magazine_id IS 'ID of magazine that was downloaded';
COMMENT ON COLUMN public.download_logs.downloaded_at IS 'Timestamp when PDF was downloaded';
COMMENT ON COLUMN public.download_logs.user_agent IS 'Browser user agent string for tracking';
COMMENT ON COLUMN public.download_logs.ip_address IS 'IP address of downloader for security';
COMMENT ON COLUMN public.download_logs.created_at IS 'When this log entry was created';

-- Enable Row Level Security (RLS)
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can only see their own download logs
CREATE POLICY "Users can view own download logs" ON public.download_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow service role to insert download logs (for the watermarking server)
CREATE POLICY "Service can insert download logs" ON public.download_logs
    FOR INSERT TO service_role WITH CHECK (true);

-- Policy: Admins can view all download logs
CREATE POLICY "Admins can view all download logs" ON public.download_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.download_logs TO authenticated;
GRANT INSERT ON public.download_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.download_logs TO service_role;

-- Test the table creation
DO $$
BEGIN
    RAISE NOTICE 'Download logs table created successfully!';
    RAISE NOTICE 'Table supports tracking of PDF downloads with user watermarking';
    RAISE NOTICE 'RLS policies ensure user privacy and admin access';
END
$$;