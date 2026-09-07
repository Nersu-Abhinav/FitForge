-- ============================================================================
-- FITFORGE MIGRATION 001: Initial Relational Database Schema
-- Baseline tables for users, goals, workouts, exercises, nutrition, and body logs
-- ============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    birth_date DATE,
    height_cm DECIMAL(5,2) DEFAULT 178.0,
    fitness_level ENUM('beginner', 'intermediate', 'advanced', 'elite') DEFAULT 'intermediate',
    unit_system ENUM('metric', 'imperial') DEFAULT 'metric',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
);

-- 2. FITNESS GOALS
CREATE TABLE IF NOT EXISTS fitness_goals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    goal_type ENUM('muscle_gain', 'fat_loss', 'strength', 'endurance', 'maintenance') DEFAULT 'muscle_gain',
    target_weight_kg DECIMAL(5,2),
    target_body_fat_pct DECIMAL(4,2),
    daily_calories INT DEFAULT 2600,
    daily_protein_g INT DEFAULT 160,
    daily_carbs_g INT DEFAULT 280,
    daily_fat_g INT DEFAULT 75,
    daily_water_ml INT DEFAULT 3500,
    weekly_workouts_target INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_goals_user (user_id, is_active)
);

-- 3. EXERCISES LIBRARY
CREATE TABLE IF NOT EXISTS exercises (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    muscle_group VARCHAR(64) NOT NULL,
    secondary_muscles JSON,
    equipment VARCHAR(64) NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'Intermediate',
    instructions JSON,
    form_cues JSON,
    common_mistakes JSON,
    recommended_rep_range VARCHAR(64),
    is_custom BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exercise_muscle (muscle_group),
    INDEX idx_exercise_name (name)
);

-- 4. WORKOUTS
CREATE TABLE IF NOT EXISTS workouts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    workout_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    calories_burned INT DEFAULT 0,
    rating TINYINT NULL,
    notes TEXT,
    status ENUM('in_progress', 'completed', 'discarded') DEFAULT 'completed',
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workout_user_date (user_id, workout_date)
);

-- 5. WORKOUT EXERCISES
CREATE TABLE IF NOT EXISTS workout_exercises (
    id VARCHAR(64) PRIMARY KEY,
    workout_id VARCHAR(64) NOT NULL,
    exercise_id VARCHAR(64) NOT NULL,
    order_index INT DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    INDEX idx_we_workout (workout_id)
);

-- 6. SETS
CREATE TABLE IF NOT EXISTS workout_sets (
    id VARCHAR(64) PRIMARY KEY,
    workout_exercise_id VARCHAR(64) NOT NULL,
    set_number INT NOT NULL,
    set_type ENUM('normal', 'warmup', 'dropset', 'failure') DEFAULT 'normal',
    weight_kg DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    rpe DECIMAL(3,1) NULL,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
    INDEX idx_sets_exercise (workout_exercise_id)
);

-- 7. FOOD ITEMS
CREATE TABLE IF NOT EXISTS food_items (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    brand VARCHAR(128) NULL,
    serving_size VARCHAR(64) NOT NULL,
    serving_unit VARCHAR(32) DEFAULT 'g',
    serving_grams DECIMAL(7,2) DEFAULT 100,
    calories DECIMAL(7,2) NOT NULL,
    protein_g DECIMAL(6,2) NOT NULL,
    carbs_g DECIMAL(6,2) NOT NULL,
    fat_g DECIMAL(6,2) NOT NULL,
    fiber_g DECIMAL(6,2) DEFAULT 0,
    sugar_g DECIMAL(6,2) DEFAULT 0,
    sodium_mg DECIMAL(7,2) DEFAULT 0,
    is_custom BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_food_name (name)
);

-- 7.1 USER FAVORITE FOODS
CREATE TABLE IF NOT EXISTS user_favorite_foods (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    food_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_fav_food (user_id, food_id)
);

-- 8. MEALS
CREATE TABLE IF NOT EXISTS meals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout') NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    total_calories INT NOT NULL,
    total_protein_g DECIMAL(6,2) NOT NULL,
    total_carbs_g DECIMAL(6,2) NOT NULL,
    total_fat_g DECIMAL(6,2) NOT NULL,
    total_fiber_g DECIMAL(6,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_meal_user_date (user_id, meal_date)
);

-- 9. MEAL ITEMS
CREATE TABLE IF NOT EXISTS meal_items (
    id VARCHAR(64) PRIMARY KEY,
    meal_id VARCHAR(64) NOT NULL,
    food_id VARCHAR(64) NOT NULL,
    quantity DECIMAL(5,2) DEFAULT 1.0,
    calculated_calories INT NOT NULL,
    calculated_protein_g DECIMAL(6,2) NOT NULL,
    calculated_carbs_g DECIMAL(6,2) NOT NULL,
    calculated_fat_g DECIMAL(6,2) NOT NULL,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(id)
);

-- 10. HYDRATION LOGS
CREATE TABLE IF NOT EXISTS hydration_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    log_date DATE NOT NULL,
    amount_ml INT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_hydro_user_date (user_id, log_date)
);

-- 11. BODY MEASUREMENTS
CREATE TABLE IF NOT EXISTS body_measurements (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    body_fat_pct DECIMAL(4,2) NULL,
    chest_cm DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    hips_cm DECIMAL(5,2) NULL,
    arms_cm DECIMAL(5,2) NULL,
    thighs_cm DECIMAL(5,2) NULL,
    shoulders_cm DECIMAL(5,2) NULL,
    neck_cm DECIMAL(5,2) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_body_user_date (user_id, measurement_date)
);

-- 12. SLEEP LOGS
CREATE TABLE IF NOT EXISTS sleep_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    sleep_date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    bedtime TIME NOT NULL,
    wake_time TIME NOT NULL,
    quality_score TINYINT DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_sleep_user_date (user_id, sleep_date)
);

-- 13. RECOVERY LOGS
CREATE TABLE IF NOT EXISTS recovery_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    recovery_date DATE NOT NULL,
    energy_level TINYINT NOT NULL,
    soreness_level TINYINT NOT NULL,
    stress_level TINYINT NOT NULL,
    recovery_score TINYINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_recovery_user_date (user_id, recovery_date)
);

-- 14. PERSONAL RECORDS
CREATE TABLE IF NOT EXISTS personal_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    exercise_id VARCHAR(64) NOT NULL,
    pr_type ENUM('max_weight', 'max_reps', 'max_volume', 'est_1rm') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    weight_kg DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    achieved_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    INDEX idx_pr_user_exercise (user_id, exercise_id)
);

-- 15. DAILY SUMMARIES
CREATE TABLE IF NOT EXISTS daily_summaries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    summary_date DATE NOT NULL,
    calories_consumed INT DEFAULT 0,
    protein_g DECIMAL(6,2) DEFAULT 0,
    carbs_g DECIMAL(6,2) DEFAULT 0,
    fat_g DECIMAL(6,2) DEFAULT 0,
    water_ml INT DEFAULT 0,
    workout_completed BOOLEAN DEFAULT FALSE,
    workout_title VARCHAR(128) NULL,
    workout_duration_min INT DEFAULT 0,
    sleep_minutes INT DEFAULT 0,
    recovery_score TINYINT DEFAULT 0,
    weight_kg DECIMAL(5,2) NULL,
    completion_score TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_summary_date (user_id, summary_date)
);
