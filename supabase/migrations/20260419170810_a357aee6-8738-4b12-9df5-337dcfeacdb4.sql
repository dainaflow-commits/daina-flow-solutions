-- Add version column to legal_documents
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0';

-- Function to bump version when content changes
CREATE OR REPLACE FUNCTION public.bump_legal_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  current_major int;
  current_minor int;
  parts text[];
BEGIN
  IF NEW.content_markdown IS DISTINCT FROM OLD.content_markdown THEN
    parts := string_to_array(OLD.version, '.');
    current_major := COALESCE(parts[1]::int, 1);
    current_minor := COALESCE(parts[2]::int, 0);
    NEW.version := current_major || '.' || (current_minor + 1);
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_bump_legal_version ON public.legal_documents;
CREATE TRIGGER trg_bump_legal_version
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.bump_legal_version();