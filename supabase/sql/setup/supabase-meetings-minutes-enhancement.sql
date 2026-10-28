-- =========================================
-- MIGRATION: Meetings to Minutes/Notes System
-- Description: Add AI-powered minutes management fields
-- Date: 2025-10-30
-- =========================================

-- Add new columns for minutes management
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS minutes_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS ai_summary JSONB,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_meetings_tags ON meetings USING GIN(tags);

-- Create index for minutes_status
CREATE INDEX IF NOT EXISTS idx_meetings_minutes_status ON meetings(minutes_status);

-- Create index for template_type
CREATE INDEX IF NOT EXISTS idx_meetings_template_type ON meetings(template_type);

-- Add check constraint for minutes_status
ALTER TABLE meetings 
DROP CONSTRAINT IF EXISTS meetings_minutes_status_check;

ALTER TABLE meetings
ADD CONSTRAINT meetings_minutes_status_check 
CHECK (minutes_status IN ('draft', 'in_review', 'approved', 'archived'));

-- Add check constraint for template_type
ALTER TABLE meetings 
DROP CONSTRAINT IF EXISTS meetings_template_type_check;

ALTER TABLE meetings
ADD CONSTRAINT meetings_template_type_check 
CHECK (template_type IN ('standard', 'formal', 'informal', 'technical', 'board'));

-- Create function to auto-update approved_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_approved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.minutes_status = 'approved' AND OLD.minutes_status != 'approved' THEN
        NEW.approved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approved_at
DROP TRIGGER IF EXISTS trigger_update_meeting_approved_at ON meetings;

CREATE TRIGGER trigger_update_meeting_approved_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_approved_at();

-- =========================================
-- MEETING VERSIONS TABLE
-- For version history and collaboration
-- =========================================

CREATE TABLE IF NOT EXISTS meeting_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    transcription TEXT,
    ai_summary JSONB,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT,
    UNIQUE(meeting_id, version_number)
);

-- Create index for meeting_versions
CREATE INDEX IF NOT EXISTS idx_meeting_versions_meeting_id ON meeting_versions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_versions_created_at ON meeting_versions(created_at DESC);

-- Enable RLS on meeting_versions
ALTER TABLE meeting_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_versions
CREATE POLICY "Users can view meeting versions"
    ON meeting_versions FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create meeting versions"
    ON meeting_versions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- =========================================
-- MEETING APPROVALS TABLE
-- For multi-approver workflow
-- =========================================

CREATE TABLE IF NOT EXISTS meeting_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, approver_id)
);

-- Create index for meeting_approvals
CREATE INDEX IF NOT EXISTS idx_meeting_approvals_meeting_id ON meeting_approvals(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_approvals_approver_id ON meeting_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_meeting_approvals_status ON meeting_approvals(status);

-- Add check constraint for approval status
ALTER TABLE meeting_approvals
DROP CONSTRAINT IF EXISTS meeting_approvals_status_check;

ALTER TABLE meeting_approvals
ADD CONSTRAINT meeting_approvals_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Enable RLS on meeting_approvals
ALTER TABLE meeting_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_approvals
CREATE POLICY "Users can view meeting approvals"
    ON meeting_approvals FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Approvers can update their approvals"
    ON meeting_approvals FOR UPDATE
    USING (auth.uid() = approver_id);

CREATE POLICY "Users can create meeting approvals"
    ON meeting_approvals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Function to get meeting approval status
CREATE OR REPLACE FUNCTION get_meeting_approval_status(p_meeting_id UUID)
RETURNS TABLE (
    total_approvers INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    pending_count INTEGER,
    all_approved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_approvers,
        COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_count,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
        BOOL_AND(status = 'approved') as all_approved
    FROM meeting_approvals
    WHERE meeting_id = p_meeting_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create version snapshot
CREATE OR REPLACE FUNCTION create_meeting_version(
    p_meeting_id UUID,
    p_created_by UUID,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
    v_meeting RECORD;
BEGIN
    -- Get current meeting data
    SELECT * INTO v_meeting FROM meetings WHERE id = p_meeting_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meeting not found';
    END IF;
    
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM meeting_versions
    WHERE meeting_id = p_meeting_id;
    
    -- Create version
    INSERT INTO meeting_versions (
        meeting_id,
        version_number,
        transcription,
        ai_summary,
        notes,
        created_by,
        change_summary
    ) VALUES (
        p_meeting_id,
        v_version_number,
        v_meeting.transcription,
        v_meeting.ai_summary,
        v_meeting.description,
        p_created_by,
        p_change_summary
    )
    RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- VIEWS
-- =========================================

-- View for meetings with approval status
CREATE OR REPLACE VIEW meetings_with_approval_status AS
SELECT 
    m.*,
    COALESCE(a.total_approvers, 0) as total_approvers,
    COALESCE(a.approved_count, 0) as approved_count,
    COALESCE(a.rejected_count, 0) as rejected_count,
    COALESCE(a.pending_count, 0) as pending_count,
    COALESCE(a.all_approved, false) as all_approved
FROM meetings m
LEFT JOIN LATERAL (
    SELECT * FROM get_meeting_approval_status(m.id)
) a ON true;

-- Grant permissions
GRANT SELECT ON meetings_with_approval_status TO authenticated;

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON COLUMN meetings.minutes_status IS 'Status of the meeting minutes: draft, in_review, approved, archived';
COMMENT ON COLUMN meetings.transcription IS 'Audio transcription text generated by AI (Whisper)';
COMMENT ON COLUMN meetings.ai_summary IS 'Structured AI-generated summary with resumo, pontos_principais, tarefas, decisoes, proximos_passos';
COMMENT ON COLUMN meetings.tags IS 'Array of tags for organizing and filtering minutes';
COMMENT ON COLUMN meetings.template_type IS 'Type of minutes template: standard, formal, informal, technical, board';
COMMENT ON COLUMN meetings.approval_required IS 'Whether this meeting requires approval workflow';
COMMENT ON COLUMN meetings.approved_by IS 'User who approved the minutes (for simple approval)';
COMMENT ON COLUMN meetings.approved_at IS 'Timestamp when minutes were approved';

COMMENT ON TABLE meeting_versions IS 'Version history for meeting minutes to track changes and enable collaboration';
COMMENT ON TABLE meeting_approvals IS 'Multi-approver workflow for meeting minutes approval';

-- =========================================
-- END OF MIGRATION
-- =========================================
