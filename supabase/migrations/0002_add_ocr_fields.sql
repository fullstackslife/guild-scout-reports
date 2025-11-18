-- Add OCR and text extraction fields to screenshots table
alter table if exists public.screenshots
add column if not exists extracted_text text,
add column if not exists processing_status text default 'pending',
add column if not exists processed_at timestamptz;

-- Create index for searching extracted text
create index if not exists screenshots_extracted_text_idx 
on public.screenshots using gin(to_tsvector('english', extracted_text));

-- Create index for processing status
create index if not exists screenshots_processing_status_idx 
on public.screenshots(processing_status);

-- Create index for recent screenshots
create index if not exists screenshots_created_at_idx 
on public.screenshots(created_at desc);
