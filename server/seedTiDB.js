import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { CANONICAL_EXERCISES } from './src/db/seeds/canonicalExercises.js';
import { CANONICAL_FOODS } from './src/db/seeds/canonicalFoods.js';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding canonical library to TiDB Cloud...');
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    }
  });

  const userId = 'usr-abhinav-01';
  await connection.query(`
    INSERT INTO users (id, name, email, height_cm, fitness_level, unit_system)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `, [userId, 'Abhinav', 'abhinav@fitforge.app', 180.0, 'intermediate', 'metric']);

  await connection.query(`
    INSERT INTO fitness_goals (id, user_id, goal_type, target_weight_kg, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, daily_water_ml, weekly_workouts_target)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE daily_calories=VALUES(daily_calories);
  `, ['goal-01', userId, 'muscle_gain', 78.5, 2600, 160, 280, 75, 3500, 5]);

  console.log('✅ Default user & goals synced to TiDB.');

  for (const ex of CANONICAL_EXERCISES) {
    await connection.query(`
      INSERT INTO exercises (id, name, category, muscle_group, secondary_muscles, equipment, difficulty, instructions, form_cues, common_mistakes, recommended_rep_range)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name),
        category=VALUES(category),
        muscle_group=VALUES(muscle_group),
        secondary_muscles=VALUES(secondary_muscles),
        equipment=VALUES(equipment),
        difficulty=VALUES(difficulty),
        instructions=VALUES(instructions),
        form_cues=VALUES(form_cues),
        common_mistakes=VALUES(common_mistakes),
        recommended_rep_range=VALUES(recommended_rep_range);
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
  console.log(`✅ ${CANONICAL_EXERCISES.length} canonical exercises synced to TiDB.`);

  for (const food of CANONICAL_FOODS) {
    await connection.query(`
      INSERT INTO food_items (id, name, brand, serving_size, serving_unit, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name),
        brand=VALUES(brand),
        serving_size=VALUES(serving_size),
        serving_unit=VALUES(serving_unit),
        serving_grams=VALUES(serving_grams),
        calories=VALUES(calories),
        protein_g=VALUES(protein_g),
        carbs_g=VALUES(carbs_g),
        fat_g=VALUES(fat_g),
        fiber_g=VALUES(fiber_g),
        sodium_mg=VALUES(sodium_mg);
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
  console.log(`✅ ${CANONICAL_FOODS.length} canonical food items synced to TiDB.`);

  await connection.end();
  console.log('🎉 TiDB Cloud Database is fully seeded with unified canonical dataset!');
}

seed().catch(console.error);
