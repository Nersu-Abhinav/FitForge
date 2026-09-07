-- ============================================================================
-- FITFORGE MIGRATION 004: Quality & Recovery Indices
-- Fast lookup for recovery readiness scoring and sleep trend correlation
-- ============================================================================

ALTER TABLE sleep_logs 
  ADD INDEX IF NOT EXISTS idx_sleep_quality (quality_score);

ALTER TABLE recovery_logs 
  ADD INDEX IF NOT EXISTS idx_recovery_score (recovery_score);
