// FitForge Pure Direct TiDB Cloud Database Server
// Complete Relational Persistence with Centralized Database Mappers and Strict Error Semantics
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import {
  DEFAULT_USER_ID,
  UserMapper,
  HydrationMapper,
  BodyMeasurementMapper,
  SleepMapper,
  RecoveryMapper,
  WorkoutMapper,
  MealMapper,
  ExerciseMapper,
  FoodItemMapper,
  SplitMapper
} from './src/db/mappers.js';
import { CANONICAL_EXERCISES } from './src/db/seeds/canonicalExercises.js';
import { CANONICAL_FOODS } from './src/db/seeds/canonicalFoods.js';
import { runMigrations } from './src/db/migrator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// TiDB Cloud Connection Pool
let pool = null;

try {
  pool = mysql.createPool({
    host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'fitforge_db',
    dateStrings: true,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0
  });
  console.log('⚡ Connected to TiDB Cloud pool for database:', process.env.TIDB_DATABASE);
} catch (err) {
  console.error('❌ Failed to initialize TiDB connection pool:', err.message);
}

// Helper: Ensure default user, migrations, and goal record exist in DB
async function ensureDefaultUser() {
  if (!pool) throw new Error('TiDB Cloud database connection pool unavailable');

  // 1. Run versioned schema migrations ledger
  try {
    await runMigrations(pool);
  } catch (migErr) {
    console.warn('[Server] Migration warning:', migErr.message);
  }

  await pool.query(`
    INSERT INTO users (id, name, email, height_cm, fitness_level, unit_system)
    VALUES (?, 'Abhinav', 'abhinav@fitforge.app', 180.0, 'intermediate', 'metric')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `, [DEFAULT_USER_ID]);

  await pool.query(`
    INSERT INTO fitness_goals (id, user_id, goal_type, target_weight_kg, target_body_fat_pct, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, daily_water_ml, weekly_workouts_target, is_active)
    VALUES (?, ?, 'muscle_gain', 78.5, 12.0, 2600, 160, 280, 75, 3500, 5, TRUE)
    ON DUPLICATE KEY UPDATE is_active = TRUE;
  `, [`goal-${DEFAULT_USER_ID}`, DEFAULT_USER_ID]);

  // 2. Ensure Canonical Baseline Library
  const [exRows] = await pool.query('SELECT COUNT(*) as count FROM exercises WHERE is_custom = 0 OR is_custom IS NULL');
  if (exRows[0].count === 0) {
    for (const ex of CANONICAL_EXERCISES) {
      await pool.query(`
        INSERT INTO exercises (id, name, category, muscle_group, secondary_muscles, equipment, difficulty, instructions, form_cues, common_mistakes, recommended_rep_range)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name);
      `, [
        ex.id,
        ex.name,
        ex.category,
        ex.muscleGroup,
        JSON.stringify(ex.secondaryMuscles || []),
        ex.equipment,
        ex.difficulty,
        JSON.stringify(ex.instructions || []),
        JSON.stringify(ex.formCues || []),
        JSON.stringify(ex.commonMistakes || []),
        ex.recommendedRepRange
      ]);
    }
  }

  const [foodRows] = await pool.query('SELECT COUNT(*) as count FROM food_items WHERE is_custom = 0 OR is_custom IS NULL');
  if (foodRows[0].count === 0) {
    for (const food of CANONICAL_FOODS) {
      await pool.query(`
        INSERT INTO food_items (id, name, brand, serving_size, serving_unit, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name);
      `, [
        food.id,
        food.name,
        food.brand || null,
        food.servingSize,
        food.servingUnit,
        food.servingGrams,
        food.calories,
        food.protein,
        food.carbs,
        food.fat,
        food.fiber || 0,
        food.sodium || 0
      ]);
    }
  }
}

// Health & Infrastructure Status Check
app.get('/api/health', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      status: 'offline', 
      database: 'disconnected', 
      latencyMs: 0,
      error: 'TiDB Pool not initialized' 
    });
  }
  const startTime = Date.now();
  try {
    const [rows] = await pool.query('SELECT 1 as connected');
    const latencyMs = Date.now() - startTime;

    const [verRows] = await pool.query('SELECT VERSION() as version');
    const [tableRows] = await pool.query('SELECT COUNT(*) as tableCount FROM information_schema.tables WHERE table_schema = DATABASE()');
    const [wCount] = await pool.query('SELECT COUNT(*) as count FROM workouts');
    const [weCount] = await pool.query('SELECT COUNT(*) as count FROM workout_exercises');
    const [wsCount] = await pool.query('SELECT COUNT(*) as count FROM workout_sets');
    const [mCount] = await pool.query('SELECT COUNT(*) as count FROM meals');
    const [miCount] = await pool.query('SELECT COUNT(*) as count FROM meal_items');
    const [hCount] = await pool.query('SELECT COUNT(*) as count FROM hydration_logs');

    const dbName = process.env.TIDB_DATABASE || 'fitforge_db';
    const versionStr = verRows[0]?.version || 'TiDB Serverless';
    const tableCount = tableRows[0]?.tableCount || 15;

    res.json({
      success: true,
      status: 'online',
      database: 'connected',
      databaseName: dbName,
      latencyMs,
      version: versionStr,
      tableCount,
      timestamp: new Date().toISOString(),
      counts: {
        workouts: wCount[0].count,
        workoutExercises: weCount[0].count,
        workoutSets: wsCount[0].count,
        meals: mCount[0].count,
        mealItems: miCount[0].count,
        hydration: hCount[0].count
      }
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    res.status(500).json({ 
      success: false, 
      status: 'error', 
      database: 'disconnected', 
      latencyMs,
      error: 'Health check query failed', 
      details: err.message 
    });
  }
});

// ================= USER & PROFILE (DIRECT SQL) =================
app.get('/api/user/profile', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    await ensureDefaultUser();
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [DEFAULT_USER_ID]);
    const [goals] = await pool.query('SELECT * FROM fitness_goals WHERE user_id = ? AND is_active = TRUE LIMIT 1', [DEFAULT_USER_ID]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in database' });
    }

    const domainUser = UserMapper.toDomain(users[0], goals[0] || {});
    res.json({ success: true, user: domainUser });
  } catch (err) {
    console.error('GET /api/user/profile error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile', details: err.message });
  }
});

app.put('/api/user/profile', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { name, heightCm, fitnessLevel, unitSystem, goals } = req.body;
    await ensureDefaultUser();

    if (name || heightCm || fitnessLevel || unitSystem) {
      await pool.query(`
        UPDATE users 
        SET 
          name = COALESCE(?, name),
          height_cm = COALESCE(?, height_cm),
          fitness_level = COALESCE(?, fitness_level),
          unit_system = COALESCE(?, unit_system)
        WHERE id = ?;
      `, [name || null, heightCm || null, fitnessLevel || null, unitSystem || null, DEFAULT_USER_ID]);
    }

    if (goals) {
      await pool.query(`
        UPDATE fitness_goals
        SET 
          goal_type = COALESCE(?, goal_type),
          target_weight_kg = COALESCE(?, target_weight_kg),
          target_body_fat_pct = COALESCE(?, target_body_fat_pct),
          daily_calories = COALESCE(?, daily_calories),
          daily_protein_g = COALESCE(?, daily_protein_g),
          daily_carbs_g = COALESCE(?, daily_carbs_g),
          daily_fat_g = COALESCE(?, daily_fat_g),
          daily_water_ml = COALESCE(?, daily_water_ml),
          weekly_workouts_target = COALESCE(?, weekly_workouts_target)
        WHERE user_id = ? AND is_active = TRUE;
      `, [
        goals.goalType || null,
        goals.targetWeightKg || null,
        goals.targetBodyFatPct || null,
        goals.dailyCalories || null,
        goals.dailyProteinGrams || null,
        goals.dailyCarbsGrams || null,
        goals.dailyFatGrams || null,
        goals.dailyWaterMl || null,
        goals.weeklyWorkoutsTarget || null,
        DEFAULT_USER_ID
      ]);
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [DEFAULT_USER_ID]);
    const [currentGoals] = await pool.query('SELECT * FROM fitness_goals WHERE user_id = ? AND is_active = TRUE LIMIT 1', [DEFAULT_USER_ID]);
    const domainUser = UserMapper.toDomain(users[0], currentGoals[0] || {});

    res.json({ success: true, user: domainUser });
  } catch (err) {
    console.error('PUT /api/user/profile error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update user profile in database', details: err.message });
  }
});

// Helper: Query full relational workouts
async function fetchFullRelationalWorkouts() {
  const [workouts] = await pool.query('SELECT * FROM workouts ORDER BY workout_date DESC, start_time DESC');
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map(w => w.id);

  const [exercises] = await pool.query(`
    SELECT 
      we.id,
      we.workout_id,
      we.exercise_id,
      we.order_index,
      we.notes,
      e.name as exercise_name,
      e.muscle_group
    FROM workout_exercises we
    LEFT JOIN exercises e ON we.exercise_id = e.id
    WHERE we.workout_id IN (?)
    ORDER BY we.order_index ASC
  `, [workoutIds]);

  let sets = [];
  if (exercises.length > 0) {
    const weIds = exercises.map(e => e.id);
    const [fetchedSets] = await pool.query(`
      SELECT *
      FROM workout_sets
      WHERE workout_exercise_id IN (?)
      ORDER BY set_number ASC
    `, [weIds]);
    sets = fetchedSets;
  }

  return workouts.map(w => WorkoutMapper.toDomain(w, exercises, sets));
}

// ================= WORKOUTS (RELATIONAL SQL) =================
app.get('/api/workouts', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const workouts = await fetchFullRelationalWorkouts();
    res.json({ success: true, workouts });
  } catch (err) {
    console.error('GET /api/workouts error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve workouts from database', details: err.message });
  }
});

app.post('/api/workouts', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  const workoutDTO = req.body;
  if (!workoutDTO || !workoutDTO.id) {
    return res.status(400).json({ success: false, error: 'Invalid workout payload: id is required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureDefaultUser();

    const row = WorkoutMapper.toRow(workoutDTO, DEFAULT_USER_ID);

    // 1. Insert / Update Workout
    await connection.query(`
      INSERT INTO workouts (id, user_id, name, workout_date, start_time, end_time, duration_seconds, calories_burned, rating, status, total_volume_kg, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        workout_date = VALUES(workout_date),
        end_time = VALUES(end_time),
        duration_seconds = VALUES(duration_seconds),
        calories_burned = VALUES(calories_burned),
        rating = VALUES(rating),
        status = VALUES(status),
        total_volume_kg = VALUES(total_volume_kg),
        notes = VALUES(notes);
    `, [
      row.id,
      row.user_id,
      row.name,
      row.workout_date,
      row.start_time,
      row.end_time,
      row.duration_seconds,
      row.calories_burned,
      row.rating,
      row.status,
      row.total_volume_kg,
      row.notes
    ]);

    // 2. Clear existing relation sets & exercises
    await connection.query(`
      DELETE ws FROM workout_sets ws
      INNER JOIN workout_exercises we ON ws.workout_exercise_id = we.id
      WHERE we.workout_id = ?;
    `, [row.id]);
    await connection.query('DELETE FROM workout_exercises WHERE workout_id = ?;', [row.id]);

    // 3. Relational Insert for Exercises and Sets
    if (workoutDTO.exercises && Array.isArray(workoutDTO.exercises)) {
      for (let i = 0; i < workoutDTO.exercises.length; i++) {
        const ex = workoutDTO.exercises[i];
        const weId = ex.id || `we-${row.id}-${i + 1}`;
        const exId = ex.exerciseId || `ex-${Date.now()}-${i}`;

        await connection.query(`
          INSERT INTO exercises (id, name, category, muscle_group, equipment)
          VALUES (?, ?, 'Strength', ?, 'Barbell')
          ON DUPLICATE KEY UPDATE name = VALUES(name);
        `, [exId, ex.exerciseName || 'Exercise', ex.muscleGroup || 'Full Body']);

        await connection.query(`
          INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, notes)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            workout_id = VALUES(workout_id),
            exercise_id = VALUES(exercise_id),
            order_index = VALUES(order_index),
            notes = VALUES(notes);
        `, [weId, row.id, exId, ex.order || i + 1, ex.notes || null]);

        if (ex.sets && Array.isArray(ex.sets)) {
          for (let j = 0; j < ex.sets.length; j++) {
            const s = ex.sets[j];
            const setId = s.id || `set-${weId}-${j + 1}`;
            await connection.query(`
              INSERT INTO workout_sets (id, workout_exercise_id, set_number, set_type, weight_kg, reps, rpe, completed, completed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                workout_exercise_id = VALUES(workout_exercise_id),
                set_number = VALUES(set_number),
                set_type = VALUES(set_type),
                weight_kg = VALUES(weight_kg),
                reps = VALUES(reps),
                rpe = VALUES(rpe),
                completed = VALUES(completed),
                completed_at = VALUES(completed_at);
            `, [
              setId,
              weId,
              s.setNumber || j + 1,
              s.type || 'normal',
              s.weightKg || 0,
              s.reps || 0,
              s.rpe || null,
              s.completed ? 1 : 0,
              s.completedAt ? new Date(s.completedAt) : new Date()
            ]);
          }
        }
      }
    }

    await connection.commit();
    console.log(`✅ Relational workout '${row.name}' saved to TiDB Cloud`);
    res.json({ success: true, workout: workoutDTO });
  } catch (err) {
    await connection.rollback();
    console.error('POST /api/workouts transactional error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist workout in database', details: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`
      DELETE ws FROM workout_sets ws
      INNER JOIN workout_exercises we ON ws.workout_exercise_id = we.id
      WHERE we.workout_id = ?;
    `, [id]);
    await connection.query('DELETE FROM workout_exercises WHERE workout_id = ?;', [id]);
    await connection.query('DELETE FROM workouts WHERE id = ?;', [id]);
    await connection.commit();
    console.log(`🗑️ Deleted relational workout '${id}' from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    await connection.rollback();
    console.error('DELETE /api/workouts/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete workout from database', details: err.message });
  } finally {
    connection.release();
  }
});

// ================= CUSTOM EXERCISES (PURE SQL) =================
app.get('/api/exercises', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM exercises WHERE is_custom = 1 AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
      [DEFAULT_USER_ID]
    );
    const exercises = rows.map(r => ExerciseMapper.toDomain(r));
    res.json({ success: true, exercises });
  } catch (err) {
    console.error('GET /api/exercises error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch custom exercises from database', details: err.message });
  }
});

app.post('/api/exercises', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const exerciseDTO = req.body;
    if (!exerciseDTO || !exerciseDTO.name) {
      return res.status(400).json({ success: false, error: 'Exercise name is required' });
    }

    const row = ExerciseMapper.toRow(exerciseDTO, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO exercises (
        id, name, category, muscle_group, secondary_muscles,
        equipment, difficulty, instructions, form_cues,
        common_mistakes, recommended_rep_range, is_custom, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        category = VALUES(category),
        muscle_group = VALUES(muscle_group),
        secondary_muscles = VALUES(secondary_muscles),
        equipment = VALUES(equipment),
        difficulty = VALUES(difficulty),
        instructions = VALUES(instructions),
        form_cues = VALUES(form_cues),
        common_mistakes = VALUES(common_mistakes),
        recommended_rep_range = VALUES(recommended_rep_range),
        is_custom = VALUES(is_custom),
        user_id = VALUES(user_id);
    `, [
      row.id,
      row.name,
      row.category,
      row.muscle_group,
      row.secondary_muscles,
      row.equipment,
      row.difficulty,
      row.instructions,
      row.form_cues,
      row.common_mistakes,
      row.recommended_rep_range,
      row.is_custom,
      row.user_id
    ]);

    console.log(`✅ Saved custom exercise '${row.name}' (id: ${row.id}) into TiDB Cloud`);
    res.json({
      success: true,
      exercise: ExerciseMapper.toDomain(row)
    });
  } catch (err) {
    console.error('POST /api/exercises error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist custom exercise in database', details: err.message });
  }
});

app.delete('/api/exercises/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
    console.log(`🗑️ Deleted custom exercise '${id}' from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/exercises/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete custom exercise from database', details: err.message });
  }
});

// ================= CUSTOM FOOD ITEMS (PURE SQL) =================
app.get('/api/foods', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM food_items WHERE is_custom = 1 AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
      [DEFAULT_USER_ID]
    );
    const foods = rows.map(r => FoodItemMapper.toDomain(r));
    res.json({ success: true, foods });
  } catch (err) {
    console.error('GET /api/foods error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch custom foods from database', details: err.message });
  }
});

app.post('/api/foods', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const foodDTO = req.body;
    if (!foodDTO || !foodDTO.name) {
      return res.status(400).json({ success: false, error: 'Food name is required' });
    }

    const row = FoodItemMapper.toRow(foodDTO, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO food_items (
        id, name, brand, serving_size, serving_unit, serving_grams,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
        sodium_mg, is_custom, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        brand = VALUES(brand),
        serving_size = VALUES(serving_size),
        serving_unit = VALUES(serving_unit),
        serving_grams = VALUES(serving_grams),
        calories = VALUES(calories),
        protein_g = VALUES(protein_g),
        carbs_g = VALUES(carbs_g),
        fat_g = VALUES(fat_g),
        fiber_g = VALUES(fiber_g),
        sugar_g = VALUES(sugar_g),
        sodium_mg = VALUES(sodium_mg),
        is_custom = VALUES(is_custom),
        user_id = VALUES(user_id);
    `, [
      row.id,
      row.name,
      row.brand,
      row.serving_size,
      row.serving_unit,
      row.serving_grams,
      row.calories,
      row.protein_g,
      row.carbs_g,
      row.fat_g,
      row.fiber_g,
      row.sugar_g,
      row.sodium_mg,
      row.is_custom,
      row.user_id
    ]);

    console.log(`✅ Saved custom food '${row.name}' (id: ${row.id}) into TiDB Cloud`);
    res.json({
      success: true,
      food: FoodItemMapper.toDomain(row)
    });
  } catch (err) {
    console.error('POST /api/foods error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist custom food in database', details: err.message });
  }
});

app.delete('/api/foods/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM food_items WHERE id = ? AND is_custom = 1', [id]);
    console.log(`🗑️ Deleted custom food '${id}' from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/foods/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete custom food from database', details: err.message });
  }
});

// ================= FAVORITE FOODS (PURE SQL) =================
app.get('/api/foods/favorites', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    await ensureDefaultUser();
    const [rows] = await pool.query('SELECT food_id FROM user_favorite_foods WHERE user_id = ?', [DEFAULT_USER_ID]);
    res.json({ success: true, favoriteFoodIds: rows.map(r => r.food_id) });
  } catch (err) {
    console.error('GET /api/foods/favorites error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch favorite foods', details: err.message });
  }
});

app.post('/api/foods/favorites', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { foodId, isFavorite } = req.body;
    if (!foodId) return res.status(400).json({ success: false, error: 'foodId is required' });
    await ensureDefaultUser();

    if (isFavorite) {
      const id = `fav-${DEFAULT_USER_ID}-${foodId}`;
      await pool.query(`
        INSERT INTO user_favorite_foods (id, user_id, food_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;
      `, [id, DEFAULT_USER_ID, foodId]);
      console.log(`⭐ Favorited food '${foodId}' in TiDB Cloud`);
    } else {
      await pool.query('DELETE FROM user_favorite_foods WHERE user_id = ? AND food_id = ?', [DEFAULT_USER_ID, foodId]);
      console.log(`🤍 Unfavorited food '${foodId}' in TiDB Cloud`);
    }

    res.json({ success: true, foodId, isFavorite: Boolean(isFavorite) });
  } catch (err) {
    console.error('POST /api/foods/favorites error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update favorite food in database', details: err.message });
  }
});

// Helper: Query full relational meals
async function fetchFullRelationalMeals(dateFilter) {
  let query = 'SELECT * FROM meals';
  const params = [];
  if (dateFilter) {
    query += ' WHERE meal_date = ?';
    params.push(dateFilter);
  }
  query += ' ORDER BY meal_date DESC, meal_time DESC';

  const [meals] = await pool.query(query, params);
  if (meals.length === 0) return [];

  const mealIds = meals.map(m => m.id);

  const [items] = await pool.query(`
    SELECT 
      mi.id,
      mi.meal_id,
      mi.food_id,
      mi.quantity,
      mi.calculated_calories,
      mi.calculated_protein_g,
      mi.calculated_carbs_g,
      mi.calculated_fat_g,
      COALESCE(mi.calculated_fiber_g, mi.fiber_g, 0) as calculated_fiber_g,
      COALESCE(fi.name, 'Food Item') as food_name,
      COALESCE(fi.serving_size, '1 serving') as serving_size,
      COALESCE(fi.fiber_g, 0) as food_fiber_g
    FROM meal_items mi
    LEFT JOIN food_items fi ON mi.food_id = fi.id
    WHERE mi.meal_id IN (?)
  `, [mealIds]);

  return meals.map(m => MealMapper.toDomain(m, items));
}

// ================= MEALS (RELATIONAL SQL) =================
app.get('/api/meals', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { date } = req.query;
    const meals = await fetchFullRelationalMeals(date);
    res.json({ success: true, meals });
  } catch (err) {
    console.error('GET /api/meals error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve meals from database', details: err.message });
  }
});

app.post('/api/meals', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  const mealDTO = req.body;
  if (!mealDTO || !mealDTO.id) {
    return res.status(400).json({ success: false, error: 'Invalid meal payload: id is required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureDefaultUser();

    const row = MealMapper.toRow(mealDTO, DEFAULT_USER_ID);

    await connection.query(`
      INSERT INTO meals (id, user_id, meal_type, meal_date, meal_time, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        meal_type = VALUES(meal_type),
        meal_date = VALUES(meal_date),
        meal_time = VALUES(meal_time),
        total_calories = VALUES(total_calories),
        total_protein_g = VALUES(total_protein_g),
        total_carbs_g = VALUES(total_carbs_g),
        total_fat_g = VALUES(total_fat_g),
        total_fiber_g = VALUES(total_fiber_g),
        notes = VALUES(notes);
    `, [
      row.id,
      row.user_id,
      row.meal_type,
      row.meal_date,
      row.meal_time,
      row.total_calories,
      row.total_protein_g,
      row.total_carbs_g,
      row.total_fat_g,
      row.total_fiber_g,
      row.notes
    ]);

    await connection.query('DELETE FROM meal_items WHERE meal_id = ?;', [row.id]);

    if (mealDTO.items && Array.isArray(mealDTO.items)) {
      for (let i = 0; i < mealDTO.items.length; i++) {
        const item = mealDTO.items[i];
        const itemId = item.id || `item-${row.id}-${i + 1}`;
        const foodId = item.foodId || `food-${Date.now()}-${i}`;

        await connection.query(`
          INSERT INTO food_items (id, name, serving_size, calories, protein_g, carbs_g, fat_g, fiber_g)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), fiber_g = VALUES(fiber_g);
        `, [
          foodId,
          item.name || 'Food Item',
          item.servingDescription || '1 serving',
          item.calories || 0,
          item.protein || 0,
          item.carbs || 0,
          item.fat || 0,
          item.fiber || 0
        ]);

        await connection.query(`
          INSERT INTO meal_items (id, meal_id, food_id, quantity, calculated_calories, calculated_protein_g, calculated_carbs_g, calculated_fat_g, calculated_fiber_g, fiber_g)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            meal_id = VALUES(meal_id),
            food_id = VALUES(food_id),
            quantity = VALUES(quantity),
            calculated_calories = VALUES(calculated_calories),
            calculated_protein_g = VALUES(calculated_protein_g),
            calculated_carbs_g = VALUES(calculated_carbs_g),
            calculated_fat_g = VALUES(calculated_fat_g),
            calculated_fiber_g = VALUES(calculated_fiber_g),
            fiber_g = VALUES(fiber_g);
        `, [
          itemId,
          row.id,
          foodId,
          item.servingQuantity || 1,
          item.calories || 0,
          item.protein || 0,
          item.carbs || 0,
          item.fat || 0,
          item.fiber || 0,
          item.fiber || 0
        ]);
      }
    }

    await connection.commit();
    console.log(`✅ Relational meal '${row.meal_type}' saved to TiDB Cloud`);
    res.json({ success: true, meal: mealDTO });
  } catch (err) {
    await connection.rollback();
    console.error('POST /api/meals transactional error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist meal in database', details: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/meals/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM meal_items WHERE meal_id = ?;', [id]);
    await pool.query('DELETE FROM meals WHERE id = ?;', [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/meals error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete meal from database', details: err.message });
  }
});

// ================= HYDRATION (DIRECT SQL) =================
app.get('/api/hydration', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { date } = req.query;
    let query = 'SELECT * FROM hydration_logs';
    const params = [];
    if (date) {
      query += ' WHERE log_date = ?';
      params.push(date);
    }
    query += ' ORDER BY logged_at DESC';

    const [rows] = await pool.query(query, params);
    const hydrationLogs = rows.map(r => HydrationMapper.toDomain(r));
    res.json({ success: true, hydrationLogs });
  } catch (err) {
    console.error('GET /api/hydration error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve hydration logs from database', details: err.message });
  }
});

app.post('/api/hydration', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const row = HydrationMapper.toRow(req.body, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO hydration_logs (id, user_id, log_date, amount_ml, logged_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        amount_ml = VALUES(amount_ml),
        log_date = VALUES(log_date);
    `, [row.id, row.user_id, row.log_date, row.amount_ml]);

    console.log(`✅ Logged ${row.amount_ml}ml water into TiDB Cloud (ID: ${row.id})`);
    res.json({
      success: true,
      log: HydrationMapper.toDomain({
        id: row.id,
        user_id: row.user_id,
        log_date: row.log_date,
        amount_ml: row.amount_ml,
        logged_at: new Date()
      })
    });
  } catch (err) {
    console.error('POST /api/hydration error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist hydration log in database', details: err.message });
  }
});

app.delete('/api/hydration/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hydration_logs WHERE id = ?;', [id]);
    console.log(`🗑️ Deleted hydration log [${id}] from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/hydration error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete hydration log from database', details: err.message });
  }
});

// ================= BODY & SLEEP & RECOVERY (DIRECT SQL) =================
app.get('/api/body', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const [measurementRows] = await pool.query('SELECT * FROM body_measurements ORDER BY measurement_date ASC');
    const [sleepRows] = await pool.query('SELECT * FROM sleep_logs ORDER BY sleep_date DESC');
    const [recoveryRows] = await pool.query('SELECT * FROM recovery_logs ORDER BY recovery_date DESC');

    res.json({
      success: true,
      measurements: measurementRows.map(r => BodyMeasurementMapper.toDomain(r)),
      sleepLogs: sleepRows.map(r => SleepMapper.toDomain(r)),
      recoveryLogs: recoveryRows.map(r => RecoveryMapper.toDomain(r))
    });
  } catch (err) {
    console.error('GET /api/body error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve body data from database', details: err.message });
  }
});

async function handleSaveBodyMeasurement(req, res) {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const row = BodyMeasurementMapper.toRow(req.body, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO body_measurements (
        id, user_id, measurement_date, weight_kg, body_fat_pct,
        chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, shoulders_cm, neck_cm, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        weight_kg = COALESCE(VALUES(weight_kg), weight_kg),
        body_fat_pct = COALESCE(VALUES(body_fat_pct), body_fat_pct),
        chest_cm = COALESCE(VALUES(chest_cm), chest_cm),
        waist_cm = COALESCE(VALUES(waist_cm), waist_cm),
        hips_cm = COALESCE(VALUES(hips_cm), hips_cm),
        arms_cm = COALESCE(VALUES(arms_cm), arms_cm),
        thighs_cm = COALESCE(VALUES(thighs_cm), thighs_cm),
        shoulders_cm = COALESCE(VALUES(shoulders_cm), shoulders_cm),
        neck_cm = COALESCE(VALUES(neck_cm), neck_cm),
        notes = COALESCE(VALUES(notes), notes);
    `, [
      row.id,
      row.user_id,
      row.measurement_date,
      row.weight_kg,
      row.body_fat_pct,
      row.chest_cm,
      row.waist_cm,
      row.hips_cm,
      row.arms_cm,
      row.thighs_cm,
      row.shoulders_cm,
      row.neck_cm,
      row.notes
    ]);

    console.log(`✅ Saved body measurement (${row.weight_kg}kg on ${row.measurement_date}) into TiDB Cloud`);
    return res.json({
      success: true,
      measurement: BodyMeasurementMapper.toDomain(row)
    });
  } catch (err) {
    console.error('POST /api/body/measurements error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to persist body measurement in database', details: err.message });
  }
}

app.post('/api/body/weight', handleSaveBodyMeasurement);
app.post('/api/body/measurements', handleSaveBodyMeasurement);

app.post('/api/body/sleep', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const row = SleepMapper.toRow(req.body, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO sleep_logs (id, user_id, sleep_date, duration_minutes, bedtime, wake_time, quality_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        duration_minutes = VALUES(duration_minutes),
        bedtime = VALUES(bedtime),
        wake_time = VALUES(wake_time),
        quality_score = VALUES(quality_score);
    `, [
      row.id,
      row.user_id,
      row.sleep_date,
      row.duration_minutes,
      row.bedtime,
      row.wake_time,
      row.quality_score
    ]);

    console.log(`✅ Saved sleep log (${row.sleep_date}) into TiDB Cloud`);
    res.json({
      success: true,
      sleepLog: SleepMapper.toDomain(row)
    });
  } catch (err) {
    console.error('POST /api/body/sleep error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist sleep log in database', details: err.message });
  }
});

app.post('/api/body/recovery', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const row = RecoveryMapper.toRow(req.body, DEFAULT_USER_ID);
    await ensureDefaultUser();

    await pool.query(`
      INSERT INTO recovery_logs (id, user_id, recovery_date, energy_level, soreness_level, stress_level, recovery_score, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        energy_level = VALUES(energy_level),
        soreness_level = VALUES(soreness_level),
        stress_level = VALUES(stress_level),
        recovery_score = VALUES(recovery_score),
        notes = VALUES(notes);
    `, [
      row.id,
      row.user_id,
      row.recovery_date,
      row.energy_level,
      row.soreness_level,
      row.stress_level,
      row.recovery_score,
      row.notes
    ]);

    console.log(`✅ Saved recovery log (${row.recovery_date}, ${row.recovery_score}%) into TiDB Cloud`);
    res.json({
      success: true,
      recoveryLog: RecoveryMapper.toDomain(row)
    });
  } catch (err) {
    console.error('POST /api/body/recovery error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist recovery log in database', details: err.message });
  }
});

app.delete('/api/body/measurements/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM body_measurements WHERE id = ? OR measurement_date = ?;', [id, id]);
    console.log(`🗑️ Deleted body measurement [${id}] from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/body/measurements error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete body measurement from database', details: err.message });
  }
});

app.delete('/api/body/sleep/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sleep_logs WHERE id = ? OR sleep_date = ?;', [id, id]);
    console.log(`🗑️ Deleted sleep log [${id}] from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/body/sleep error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete sleep log from database', details: err.message });
  }
});

app.delete('/api/body/recovery/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recovery_logs WHERE id = ? OR recovery_date = ?;', [id, id]);
    console.log(`🗑️ Deleted recovery log [${id}] from TiDB Cloud`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/body/recovery error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete recovery log from database', details: err.message });
  }
});

// ================= USER WEEKLY SPLIT ROUTES =================
app.get('/api/split', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    await ensureDefaultUser();
    const [rows] = await pool.query(
      'SELECT * FROM user_splits WHERE user_id = ? ORDER BY CASE WHEN day_index = 0 THEN 7 ELSE day_index END ASC',
      [DEFAULT_USER_ID]
    );
    if (rows && rows.length > 0) {
      const split = rows.map(r => SplitMapper.toDomain(r));
      return res.json({ success: true, split });
    }
    return res.json({ success: true, split: null });
  } catch (err) {
    console.error('GET /api/split error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch weekly split', details: err.message });
  }
});

app.put('/api/split', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const splitDays = Array.isArray(req.body) ? req.body : req.body.split;
    if (!Array.isArray(splitDays) || splitDays.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid split array provided' });
    }
    await ensureDefaultUser();

    for (const day of splitDays) {
      const row = SplitMapper.toRow(day, DEFAULT_USER_ID);
      await pool.query(`
        INSERT INTO user_splits (
          id, user_id, day_name, day_short, day_index, title, subtitle, tag, 
          selected_muscles, is_rest, exercise_ids, estimated_minutes, overview_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          day_name = VALUES(day_name),
          day_short = VALUES(day_short),
          title = VALUES(title),
          subtitle = VALUES(subtitle),
          tag = VALUES(tag),
          selected_muscles = VALUES(selected_muscles),
          is_rest = VALUES(is_rest),
          exercise_ids = VALUES(exercise_ids),
          estimated_minutes = VALUES(estimated_minutes),
          overview_notes = VALUES(overview_notes);
      `, [
        row.id,
        row.user_id,
        row.day_name,
        row.day_short,
        row.day_index,
        row.title,
        row.subtitle,
        row.tag,
        row.selected_muscles,
        row.is_rest,
        row.exercise_ids,
        row.estimated_minutes,
        row.overview_notes
      ]);
    }

    console.log(`✅ Saved ${splitDays.length} weekly split days into TiDB Cloud for ${DEFAULT_USER_ID}`);
    res.json({ success: true, count: splitDays.length });
  } catch (err) {
    console.error('PUT /api/split error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to persist weekly split in database', details: err.message });
  }
});

// ================= UNIFIED SYNC ALL (PURE RELATIONAL SQL) =================
app.get('/api/sync/all', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    await ensureDefaultUser();

    // 1. User & Goals directly from TiDB SQL
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [DEFAULT_USER_ID]);
    const [goalRows] = await pool.query('SELECT * FROM fitness_goals WHERE user_id = ? AND is_active = TRUE LIMIT 1', [DEFAULT_USER_ID]);
    const userProfile = UserMapper.toDomain(userRows[0] || {}, goalRows[0] || {});

    // 2. Full Relational Workouts (workouts -> workout_exercises -> workout_sets)
    const workouts = await fetchFullRelationalWorkouts();

    // 3. Full Relational Meals (meals -> meal_items -> food_items)
    const meals = await fetchFullRelationalMeals();

    // 4. Hydration directly from TiDB SQL
    const [hydrationRows] = await pool.query('SELECT * FROM hydration_logs ORDER BY logged_at DESC');
    const hydration = hydrationRows.map(r => HydrationMapper.toDomain(r));

    // 5. Body Measurements directly from TiDB SQL
    const [measurementRows] = await pool.query('SELECT * FROM body_measurements ORDER BY measurement_date ASC');
    const measurements = measurementRows.map(r => BodyMeasurementMapper.toDomain(r));

    // 6. Sleep Logs directly from TiDB SQL
    const [sleepRows] = await pool.query('SELECT * FROM sleep_logs ORDER BY sleep_date DESC');
    const sleepLogs = sleepRows.map(r => SleepMapper.toDomain(r));

    // 7. Recovery Logs directly from TiDB SQL
    const [recoveryRows] = await pool.query('SELECT * FROM recovery_logs ORDER BY recovery_date DESC');
    const recoveryLogs = recoveryRows.map(r => RecoveryMapper.toDomain(r));

    // 8. Custom Exercises directly from TiDB SQL
    const [customExerciseRows] = await pool.query(
      'SELECT * FROM exercises WHERE is_custom = 1 AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
      [DEFAULT_USER_ID]
    );
    const customExercises = customExerciseRows.map(r => ExerciseMapper.toDomain(r));

    // 9. Custom Foods directly from TiDB SQL
    const [customFoodRows] = await pool.query(
      'SELECT * FROM food_items WHERE is_custom = 1 AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
      [DEFAULT_USER_ID]
    );
    const customFoods = customFoodRows.map(r => FoodItemMapper.toDomain(r));

    // 10. Favorite Food IDs directly from TiDB SQL
    const [favRows] = await pool.query(
      'SELECT food_id FROM user_favorite_foods WHERE user_id = ?',
      [DEFAULT_USER_ID]
    );
    const favoriteFoodIds = favRows.map(r => r.food_id);

    // 11. Custom Weekly Split directly from TiDB SQL (Mon to Sun)
    const [splitRows] = await pool.query(
      'SELECT * FROM user_splits WHERE user_id = ? ORDER BY CASE WHEN day_index = 0 THEN 7 ELSE day_index END ASC',
      [DEFAULT_USER_ID]
    );
    const weeklySplit = splitRows && splitRows.length === 7 
      ? splitRows.map(r => SplitMapper.toDomain(r))
      : null;

    res.json({
      success: true,
      serverTimestamp: new Date().toISOString(),
      user: userProfile,
      workouts,
      meals,
      hydration,
      measurements,
      sleepLogs,
      recoveryLogs,
      customExercises,
      customFoods,
      favoriteFoodIds,
      weeklySplit
    });
  } catch (err) {
    console.error('GET /api/sync/all error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to sync database data', details: err.message });
  }
});

// ================= CSV EXPORT ROUTE (PURE SQL) =================
app.get('/api/export/workouts/csv', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    const workouts = await fetchFullRelationalWorkouts();
    const escapeField = (val) => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`;

    let csv = 'Workout Date,Workout Name,Duration Minutes,Volume Kg,Rating,Calories Burned\n';
    for (const w of workouts) {
      const dateVal = escapeField(w.date);
      const nameVal = escapeField(w.name);
      const durationVal = escapeField(Math.round((w.durationSeconds || 0) / 60));
      const volumeVal = escapeField(w.totalVolumeKg || 0);
      const ratingVal = escapeField(w.rating !== undefined && w.rating !== null ? w.rating : '');
      const calVal = escapeField(w.caloriesBurned !== undefined && w.caloriesBurned !== null ? w.caloriesBurned : '');
      csv += `${dateVal},${nameVal},${durationVal},${volumeVal},${ratingVal},${calVal}\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fitforge_workouts_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('GET /api/export/workouts/csv error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to export CSV', details: err.message });
  }
});

// ================= WIPE DATABASE (PURE SQL) =================
app.post('/api/clear-all-data', async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database service unavailable' });
  try {
    await pool.query('DELETE FROM workout_sets;');
    await pool.query('DELETE FROM workout_exercises;');
    await pool.query('DELETE FROM workouts;');
    await pool.query('DELETE FROM meal_items;');
    await pool.query('DELETE FROM meals;');
    await pool.query('DELETE FROM hydration_logs;');
    await pool.query('DELETE FROM body_measurements;');
    await pool.query('DELETE FROM sleep_logs;');
    await pool.query('DELETE FROM recovery_logs;');
    await pool.query('DELETE FROM personal_records;');
    await pool.query('DELETE FROM exercises WHERE is_custom = 1;');
    await pool.query('DELETE FROM food_items WHERE is_custom = 1;');
    await pool.query('DELETE FROM user_favorite_foods;');
    console.log('🧹 All user workout, nutrition, hydration & body logs wiped clean.');
    res.json({ success: true, message: 'All user data wiped clean.' });
  } catch (err) {
    console.error('POST /api/clear-all-data error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear database data', details: err.message });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ FitForge Pure TiDB Relational API Server running on port ${PORT} (0.0.0.0 - accessible to mobile clients)`);
  });
}
