-- ============================================================================
-- FITFORGE MIGRATION 003: Performance Indexes for PRs & Analytics
-- Optimizes historical lookup and progressive overload calculations
-- ============================================================================

ALTER TABLE personal_records 
  ADD INDEX IF NOT EXISTS idx_pr_achieved_date (achieved_date);

ALTER TABLE workouts 
  ADD INDEX IF NOT EXISTS idx_workout_status (status);

ALTER TABLE meals 
  ADD INDEX IF NOT EXISTS idx_meal_type (meal_type);
