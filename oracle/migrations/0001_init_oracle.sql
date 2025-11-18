-- Oracle Autonomous Database Migration
-- Converts PostgreSQL schema to Oracle-compatible SQL
-- Run this in Oracle Cloud Console: Database Actions → SQL

-- Create profiles table
CREATE TABLE profiles (
  id RAW(16) PRIMARY KEY,
  email VARCHAR2(255) NOT NULL,
  display_name VARCHAR2(255) NOT NULL,
  username VARCHAR2(100) UNIQUE,
  phone VARCHAR2(20) UNIQUE,
  role VARCHAR2(20) NOT NULL DEFAULT 'member',
  active NUMBER(1) NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

-- Create screenshots table
CREATE TABLE screenshots (
  id RAW(16) PRIMARY KEY DEFAULT SYS_GUID(),
  user_id RAW(16) NOT NULL,
  file_path VARCHAR2(500) NOT NULL,
  label VARCHAR2(500),
  extracted_text CLOB,
  processing_status VARCHAR2(20) DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
  CONSTRAINT fk_screenshot_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_screenshots_user_id ON screenshots(user_id, created_at DESC);
CREATE INDEX idx_screenshots_status ON screenshots(processing_status);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
  :NEW.updated_at := SYSTIMESTAMP;
END;
/

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to authentication';
COMMENT ON TABLE screenshots IS 'Screenshot metadata and OCR results';
COMMENT ON COLUMN profiles.id IS 'UUID stored as RAW(16)';
COMMENT ON COLUMN screenshots.id IS 'UUID stored as RAW(16)';
COMMENT ON COLUMN screenshots.user_id IS 'Foreign key to profiles.id';
COMMENT ON COLUMN screenshots.extracted_text IS 'OCR extracted text, stored as CLOB for large content';

-- Note: Row Level Security (RLS) equivalent in Oracle
-- Oracle uses Virtual Private Database (VPD) or Application Context
-- For now, implement access control in application layer
-- Or implement VPD policies if needed for database-level security

