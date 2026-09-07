import { FoodItem } from '@/types';

export interface NutritionCalculationInput {
  food: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    servingSize?: string;
    servingUnit?: string;
    servingGrams?: number;
  };
  quantity: number;
  unit?: string;
}

export interface CalculatedNutrition {
  multiplier: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingDescription: string;
  weightInGrams: number;
}

/**
 * Robust nutrition calculator that accurately distinguishes between:
 * 1. Unit / Serving count (e.g. 1 egg, 2 scoops, 1 glass, 1 serving)
 * 2. Raw weight / volume in grams or milliliters (e.g. 50g egg, 150g chicken, 300ml milk)
 */
export function calculateNutrition({
  food,
  quantity,
  unit
}: NutritionCalculationInput): CalculatedNutrition {
  const safeQty = isNaN(quantity) || quantity < 0 ? 0 : quantity;
  const baseGrams = food.servingGrams && food.servingGrams > 0 ? food.servingGrams : 100;
  const foodUnit = (food.servingUnit || 'serving').toLowerCase().trim();
  const targetUnit = (unit || foodUnit).toLowerCase().trim();

  const isWeightOrVolume = ['g', 'gram', 'grams', 'ml', 'milliliter', 'milliliters'].includes(targetUnit);

  let multiplier = 1;
  let weightInGrams = Math.round(safeQty * baseGrams);
  let servingDescription = '';

  if (isWeightOrVolume) {
    // Mode A: User logged in grams or ml (e.g., 50g, 150g, 300ml)
    multiplier = safeQty / baseGrams;
    weightInGrams = Math.round(safeQty);
    const unitSuffix = targetUnit.startsWith('m') ? 'ml' : 'g';
    servingDescription = `${safeQty}${unitSuffix}`;
  } else {
    // Mode B: User logged in count of servings / discrete units (e.g. 1 egg, 2 scoops, 1 portion)
    multiplier = safeQty;
    weightInGrams = Math.round(safeQty * baseGrams);

    const isPlural = safeQty !== 1;
    const baseServingName = food.servingUnit || 'serving';
    const displayUnitName = isPlural
      ? baseServingName.endsWith('s')
        ? baseServingName
        : `${baseServingName}s`
      : baseServingName;

    if (foodUnit === 'g' || foodUnit === 'ml') {
      servingDescription = isPlural
        ? `${safeQty} × ${food.servingSize || `${baseGrams}g`} (${weightInGrams}g)`
        : `${food.servingSize || `${baseGrams}g`}`;
    } else {
      servingDescription = `${safeQty} ${displayUnitName} (${weightInGrams}g)`;
    }
  }

  const calories = Math.round((food.calories || 0) * multiplier);
  const protein = Math.round((food.protein || 0) * multiplier * 10) / 10;
  const carbs = Math.round((food.carbs || 0) * multiplier * 10) / 10;
  const fat = Math.round((food.fat || 0) * multiplier * 10) / 10;
  const fiber = food.fiber ? Math.round(food.fiber * multiplier * 10) / 10 : 0;

  return {
    multiplier,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    servingDescription,
    weightInGrams
  };
}
