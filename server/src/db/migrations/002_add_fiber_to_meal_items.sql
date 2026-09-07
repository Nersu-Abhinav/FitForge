-- ============================================================================
-- FITFORGE MIGRATION 002: Add Fiber to Meal Items & Food Items
-- Persists calculated fiber for individual meal components
-- ============================================================================

ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS calculated_fiber_g DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(8,2) DEFAULT 0;

ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(6,2) DEFAULT 0;
