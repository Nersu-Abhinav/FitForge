-- FITFORGE Migration 005: Add User Weekly Training Splits Table
CREATE TABLE IF NOT EXISTS user_splits (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    day_name VARCHAR(32) NOT NULL,
    day_short VARCHAR(8) NOT NULL,
    day_index TINYINT NOT NULL,
    title VARCHAR(128) NOT NULL,
    subtitle VARCHAR(255) NULL,
    tag VARCHAR(64) NULL,
    selected_muscles JSON NULL,
    is_rest BOOLEAN DEFAULT FALSE,
    exercise_ids JSON NULL,
    estimated_minutes INT DEFAULT 60,
    overview_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_day_index (user_id, day_index)
);
