-- ================================================
-- MIGRATION: Add avatar_url to team table
-- ================================================

-- Add avatar_url column to team table
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_avatar_url ON team(avatar_url);

-- Create storage bucket for team avatars if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-avatars', 'team-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for team-avatars bucket
CREATE POLICY "Team avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-avatars');

CREATE POLICY "Users can upload team avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own team avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own team avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-avatars' AND
  auth.role() = 'authenticated'
);

-- Comments
COMMENT ON COLUMN team.avatar_url IS 'URL da foto de perfil do membro da equipe armazenada no Supabase Storage';
COMMENT ON TABLE storage.buckets IS 'Bucket team-avatars: Armazena fotos de perfil dos membros da equipe';
