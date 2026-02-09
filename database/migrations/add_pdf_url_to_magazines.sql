-- Add pdf_url column to magazines table
ALTER TABLE public.magazines
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add comment to document the column
COMMENT ON COLUMN public.magazines.pdf_url IS 'URL to the magazine PDF file stored in Supabase storage';
