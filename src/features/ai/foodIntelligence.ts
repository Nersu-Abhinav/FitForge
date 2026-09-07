// FitForge - AI Food & Nutrition Intelligence Engine
// Parses natural language meal queries and computes comprehensive nutritional breakdown

export interface ParsedFoodComponent {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isUnknown?: boolean;
  isEstimated?: boolean;
}

export interface AIMealAnalysisResult {
  rawQuery: string;
  mealTitle: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  components: ParsedFoodComponent[];
  healthNotes: string[];
  confidence: 'High' | 'Medium' | 'Estimated';
  hasUnknownItems?: boolean;
}

// Comprehensive Food Nutrient Reference Table (per standard unit / 100g / 1 portion)
const FOOD_KNOWLEDGE_BASE: Record<string, {
  defaultUnit: string;
  unitWeightG: number;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  fiberPerUnit: number;
  synonyms: string[];
}> = {
  // ==========================================
  // INDIAN BREAKFAST & TRADITIONAL
  // ==========================================
  idli: {
    defaultUnit: '1 idli (50g)',
    unitWeightG: 50,
    caloriesPerUnit: 58,
    proteinPerUnit: 2.0,
    carbsPerUnit: 12.0,
    fatPerUnit: 0.2,
    fiberPerUnit: 1.0,
    synonyms: ['idli', 'idly', 'steamed idli', 'idlis', 'idlies']
  },
  dosa_plain: {
    defaultUnit: '1 dosa (80g)',
    unitWeightG: 80,
    caloriesPerUnit: 135,
    proteinPerUnit: 3.2,
    carbsPerUnit: 23.0,
    fatPerUnit: 3.5,
    fiberPerUnit: 1.2,
    synonyms: ['plain dosa', 'dosa', 'dosai', 'sada dosa', 'dosas']
  },
  dosa_masala: {
    defaultUnit: '1 masala dosa (160g)',
    unitWeightG: 160,
    caloriesPerUnit: 250,
    proteinPerUnit: 5.5,
    carbsPerUnit: 38.0,
    fatPerUnit: 8.5,
    fiberPerUnit: 2.8,
    synonyms: ['masala dosa', 'alu dosa', 'potato dosa', 'masala dosai']
  },
  sambar: {
    defaultUnit: 'bowl (200ml)',
    unitWeightG: 200,
    caloriesPerUnit: 110,
    proteinPerUnit: 5.0,
    carbsPerUnit: 17.0,
    fatPerUnit: 2.5,
    fiberPerUnit: 3.5,
    synonyms: ['sambar', 'sambhar', 'sambaar', 'bowl of sambar', 'cup of sambar']
  },
  poha: {
    defaultUnit: 'bowl (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 210,
    proteinPerUnit: 4.5,
    carbsPerUnit: 36.0,
    fatPerUnit: 5.5,
    fiberPerUnit: 2.5,
    synonyms: ['poha', 'kanda poha', 'avalakki', 'chivda poha', 'bowl of poha']
  },
  upma: {
    defaultUnit: 'bowl (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 195,
    proteinPerUnit: 4.2,
    carbsPerUnit: 32.0,
    fatPerUnit: 5.8,
    fiberPerUnit: 2.0,
    synonyms: ['upma', 'rava upma', 'sooji upma', 'uppittu', 'bowl of upma']
  },
  vada_medu: {
    defaultUnit: '1 piece (45g)',
    unitWeightG: 45,
    caloriesPerUnit: 145,
    proteinPerUnit: 4.0,
    carbsPerUnit: 13.0,
    fatPerUnit: 8.5,
    fiberPerUnit: 1.5,
    synonyms: ['vada', 'medu vada', 'medhu vadai', 'urad vada', 'vadas']
  },
  uttapam: {
    defaultUnit: '1 piece (120g)',
    unitWeightG: 120,
    caloriesPerUnit: 190,
    proteinPerUnit: 4.5,
    carbsPerUnit: 30.0,
    fatPerUnit: 5.5,
    fiberPerUnit: 2.5,
    synonyms: ['uttapam', 'oothappam', 'onion uttapam', 'tomato uttapam']
  },
  thepla: {
    defaultUnit: '1 piece (40g)',
    unitWeightG: 40,
    caloriesPerUnit: 115,
    proteinPerUnit: 3.0,
    carbsPerUnit: 18.0,
    fatPerUnit: 3.5,
    fiberPerUnit: 2.0,
    synonyms: ['thepla', 'methi thepla', 'theplas']
  },

  // ==========================================
  // INDIAN MAINS, CURRIES, DALS & LEGUMES
  // ==========================================
  dal_tadka: {
    defaultUnit: 'bowl (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 145,
    proteinPerUnit: 7.5,
    carbsPerUnit: 20.0,
    fatPerUnit: 3.8,
    fiberPerUnit: 4.0,
    synonyms: ['dal', 'daal', 'dal tadka', 'yellow dal', 'toor dal', 'moong dal', 'arhar dal', 'bowl of dal']
  },
  dal_makhani: {
    defaultUnit: 'bowl (180g)',
    unitWeightG: 180,
    caloriesPerUnit: 260,
    proteinPerUnit: 9.0,
    carbsPerUnit: 24.0,
    fatPerUnit: 14.0,
    fiberPerUnit: 5.5,
    synonyms: ['dal makhani', 'makhani dal', 'black dal', 'maa ki dal']
  },
  rajma: {
    defaultUnit: 'bowl (180g)',
    unitWeightG: 180,
    caloriesPerUnit: 180,
    proteinPerUnit: 9.5,
    carbsPerUnit: 26.0,
    fatPerUnit: 4.0,
    fiberPerUnit: 6.5,
    synonyms: ['rajma', 'rajma curry', 'rajma masala', 'kidney beans curry', 'bowl of rajma', 'rajma chawal']
  },
  chole: {
    defaultUnit: 'bowl (180g)',
    unitWeightG: 180,
    caloriesPerUnit: 220,
    proteinPerUnit: 10.0,
    carbsPerUnit: 30.0,
    fatPerUnit: 6.0,
    fiberPerUnit: 7.0,
    synonyms: ['chole', 'chana masala', 'chole curry', 'kabuli chana', 'chickpea curry', 'bowl of chole']
  },
  curd_rice: {
    defaultUnit: 'bowl (220g)',
    unitWeightG: 220,
    caloriesPerUnit: 240,
    proteinPerUnit: 6.5,
    carbsPerUnit: 38.0,
    fatPerUnit: 6.5,
    fiberPerUnit: 1.5,
    synonyms: ['curd rice', 'thayir sadam', 'dahi chawal', 'thayir satham', 'bowl of curd rice']
  },
  biryani_chicken: {
    defaultUnit: 'portion (350g)',
    unitWeightG: 350,
    caloriesPerUnit: 490,
    proteinPerUnit: 28.0,
    carbsPerUnit: 58.0,
    fatPerUnit: 16.0,
    fiberPerUnit: 3.0,
    synonyms: ['chicken biryani', 'biryani', 'dum biryani', 'plate of biryani', 'murgh biryani']
  },
  biryani_veg: {
    defaultUnit: 'portion (300g)',
    unitWeightG: 300,
    caloriesPerUnit: 360,
    proteinPerUnit: 7.5,
    carbsPerUnit: 60.0,
    fatPerUnit: 10.0,
    fiberPerUnit: 4.5,
    synonyms: ['veg biryani', 'vegetable biryani', 'veg pulao', 'vegetable pulao', 'pulao']
  },
  khichdi: {
    defaultUnit: 'bowl (220g)',
    unitWeightG: 220,
    caloriesPerUnit: 220,
    proteinPerUnit: 8.0,
    carbsPerUnit: 40.0,
    fatPerUnit: 3.0,
    fiberPerUnit: 3.5,
    synonyms: ['khichdi', 'dal khichdi', 'moong khichdi', 'bowl of khichdi']
  },
  palak_paneer: {
    defaultUnit: 'bowl (180g)',
    unitWeightG: 180,
    caloriesPerUnit: 240,
    proteinPerUnit: 13.0,
    carbsPerUnit: 8.0,
    fatPerUnit: 17.0,
    fiberPerUnit: 4.0,
    synonyms: ['palak paneer', 'spinach paneer', 'saag paneer']
  },
  paneer_tikka: {
    defaultUnit: 'plate (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 280,
    proteinPerUnit: 19.0,
    carbsPerUnit: 6.0,
    fatPerUnit: 20.0,
    fiberPerUnit: 1.5,
    synonyms: ['paneer tikka', 'tandoori paneer', 'grilled paneer']
  },
  chicken_curry: {
    defaultUnit: 'bowl (200g)',
    unitWeightG: 200,
    caloriesPerUnit: 260,
    proteinPerUnit: 26.0,
    carbsPerUnit: 6.0,
    fatPerUnit: 14.0,
    fiberPerUnit: 1.8,
    synonyms: ['chicken curry', 'desi chicken curry', 'tariwala chicken', 'murgh curry', 'bowl of chicken curry']
  },
  egg_curry: {
    defaultUnit: 'bowl (200g)',
    unitWeightG: 200,
    caloriesPerUnit: 240,
    proteinPerUnit: 15.0,
    carbsPerUnit: 8.0,
    fatPerUnit: 16.0,
    fiberPerUnit: 1.5,
    synonyms: ['egg curry', 'anda curry', 'anda gravy', 'boiled egg curry']
  },
  pav_bhaji: {
    defaultUnit: 'plate (280g)',
    unitWeightG: 280,
    caloriesPerUnit: 420,
    proteinPerUnit: 9.0,
    carbsPerUnit: 64.0,
    fatPerUnit: 14.0,
    fiberPerUnit: 6.0,
    synonyms: ['pav bhaji', 'bhaji pav', 'plate of pav bhaji']
  },

  // ==========================================
  // INDIAN FLATBREADS
  // ==========================================
  roti: {
    defaultUnit: '1 piece (40g)',
    unitWeightG: 40,
    caloriesPerUnit: 104,
    proteinPerUnit: 3.5,
    carbsPerUnit: 21.0,
    fatPerUnit: 0.6,
    fiberPerUnit: 2.8,
    synonyms: ['roti', 'chapati', 'phulka', 'chappathi', 'rotli', 'wheat roti', 'rotis', 'chapatis', 'phulkas']
  },
  aloo_paratha: {
    defaultUnit: '1 paratha (120g)',
    unitWeightG: 120,
    caloriesPerUnit: 260,
    proteinPerUnit: 5.5,
    carbsPerUnit: 42.0,
    fatPerUnit: 8.0,
    fiberPerUnit: 3.5,
    synonyms: ['aloo paratha', 'alu paratha', 'potato paratha', 'paratha', 'parathas']
  },
  paneer_paratha: {
    defaultUnit: '1 paratha (130g)',
    unitWeightG: 130,
    caloriesPerUnit: 310,
    proteinPerUnit: 13.5,
    carbsPerUnit: 36.0,
    fatPerUnit: 12.5,
    fiberPerUnit: 3.2,
    synonyms: ['paneer paratha', 'cottage cheese paratha']
  },

  // ==========================================
  // INDIAN FITNESS SNACKS & DAIRY
  // ==========================================
  soya_chunks: {
    defaultUnit: '50g dry',
    unitWeightG: 50,
    caloriesPerUnit: 172,
    proteinPerUnit: 26.0,
    carbsPerUnit: 16.5,
    fatPerUnit: 0.3,
    fiberPerUnit: 6.5,
    synonyms: ['soya chunks', 'nutrela', 'soya bean chunks', 'mealmaker', 'soya granules']
  },
  moong_sprouts: {
    defaultUnit: 'cup (100g)',
    unitWeightG: 100,
    caloriesPerUnit: 30,
    proteinPerUnit: 3.1,
    carbsPerUnit: 5.9,
    fatPerUnit: 0.2,
    fiberPerUnit: 2.0,
    synonyms: ['sprouts', 'moong sprouts', 'green gram sprouts', 'sprouted moong', 'bowl of sprouts']
  },
  kala_chana: {
    defaultUnit: 'cup (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 185,
    proteinPerUnit: 11.0,
    carbsPerUnit: 28.0,
    fatPerUnit: 2.8,
    fiberPerUnit: 8.5,
    synonyms: ['kala chana', 'black chana', 'desi chana', 'boiled chana']
  },
  roasted_chana: {
    defaultUnit: 'cup (50g)',
    unitWeightG: 50,
    caloriesPerUnit: 180,
    proteinPerUnit: 9.5,
    carbsPerUnit: 27.0,
    fatPerUnit: 2.5,
    fiberPerUnit: 5.5,
    synonyms: ['bhuna chana', 'roasted chana', 'roasted gram', 'futana']
  },
  makhana: {
    defaultUnit: 'bowl (35g)',
    unitWeightG: 35,
    caloriesPerUnit: 130,
    proteinPerUnit: 3.5,
    carbsPerUnit: 24.0,
    fatPerUnit: 1.8,
    fiberPerUnit: 2.5,
    synonyms: ['makhana', 'foxnuts', 'lotus seeds', 'roasted makhana', 'phool makhana', 'bowl of makhana']
  },
  indian_curd: {
    defaultUnit: 'cup (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 95,
    proteinPerUnit: 5.2,
    carbsPerUnit: 6.8,
    fatPerUnit: 5.0,
    fiberPerUnit: 0,
    synonyms: ['curd', 'dahi', 'plain curd', 'homemade dahi', 'thayir', 'perugu', 'cup of curd', 'bowl of dahi']
  },
  chaas: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 45,
    proteinPerUnit: 3.0,
    carbsPerUnit: 4.5,
    fatPerUnit: 1.2,
    fiberPerUnit: 0.2,
    synonyms: ['chaas', 'buttermilk', 'masala chaas', 'mattha', 'moru', 'majjiga', 'glass of chaas']
  },
  lassi: {
    defaultUnit: 'glass (300ml)',
    unitWeightG: 300,
    caloriesPerUnit: 220,
    proteinPerUnit: 6.5,
    carbsPerUnit: 32.0,
    fatPerUnit: 7.5,
    fiberPerUnit: 0,
    synonyms: ['lassi', 'sweet lassi', 'punjabi lassi', 'glass of lassi']
  },
  paneer: {
    defaultUnit: '100g',
    unitWeightG: 100,
    caloriesPerUnit: 265,
    proteinPerUnit: 18.0,
    carbsPerUnit: 3.5,
    fatPerUnit: 20.0,
    fiberPerUnit: 0,
    synonyms: ['paneer', 'cottage cheese', 'fresh paneer', 'raw paneer', 'cubes of paneer']
  },

  // ==========================================
  // DAIRY & MILKS
  // ==========================================
  milk_whole: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 150,
    proteinPerUnit: 8.0,
    carbsPerUnit: 12.0,
    fatPerUnit: 8.0,
    fiberPerUnit: 0,
    synonyms: ['milk', 'whole milk', 'full cream milk', 'cow milk', 'buffalo milk', 'glass of milk', 'cup of milk', 'doodh']
  },
  milk_skimmed: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 90,
    proteinPerUnit: 8.5,
    carbsPerUnit: 12.5,
    fatPerUnit: 0.5,
    fiberPerUnit: 0,
    synonyms: ['skimmed milk', 'skim milk', 'low fat milk', 'toned milk', 'non fat milk', 'fat free milk']
  },
  milk_almond: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 40,
    proteinPerUnit: 1.5,
    carbsPerUnit: 1.5,
    fatPerUnit: 3.0,
    fiberPerUnit: 0.5,
    synonyms: ['almond milk', 'unsweetened almond milk']
  },
  milk_oat: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 120,
    proteinPerUnit: 3.0,
    carbsPerUnit: 16.0,
    fatPerUnit: 5.0,
    fiberPerUnit: 2.0,
    synonyms: ['oat milk', 'oatmilk']
  },
  milk_soy: {
    defaultUnit: 'glass (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 100,
    proteinPerUnit: 7.0,
    carbsPerUnit: 4.0,
    fatPerUnit: 4.0,
    fiberPerUnit: 1.5,
    synonyms: ['soy milk', 'soya milk']
  },
  greek_yogurt: {
    defaultUnit: 'cup (170g)',
    unitWeightG: 170,
    caloriesPerUnit: 100,
    proteinPerUnit: 18.0,
    carbsPerUnit: 6.0,
    fatPerUnit: 0,
    fiberPerUnit: 0,
    synonyms: ['greek yogurt', 'greek curd', 'hung curd', 'fage', 'chobani', 'cup of greek yogurt']
  },
  cheese: {
    defaultUnit: 'slice (28g)',
    unitWeightG: 28,
    caloriesPerUnit: 110,
    proteinPerUnit: 7.0,
    carbsPerUnit: 0.5,
    fatPerUnit: 9.0,
    fiberPerUnit: 0,
    synonyms: ['cheese', 'cheddar cheese', 'mozzarella', 'cheese slice']
  },
  butter: {
    defaultUnit: 'tbsp (14g)',
    unitWeightG: 14,
    caloriesPerUnit: 100,
    proteinPerUnit: 0.1,
    carbsPerUnit: 0,
    fatPerUnit: 11.5,
    fiberPerUnit: 0,
    synonyms: ['butter', 'tbsp butter', 'ghee', 'clarified butter', 'tsp ghee', 'tbsp ghee']
  },

  // ==========================================
  // EGGS & MEATS
  // ==========================================
  egg_whole: {
    defaultUnit: 'large egg',
    unitWeightG: 50,
    caloriesPerUnit: 72,
    proteinPerUnit: 6.3,
    carbsPerUnit: 0.4,
    fatPerUnit: 4.8,
    fiberPerUnit: 0,
    synonyms: ['egg', 'whole egg', 'boiled egg', 'fried egg', 'scrambled egg', 'poached egg', 'eggs', 'boiled eggs', 'anda', 'ande']
  },
  egg_white: {
    defaultUnit: 'white (33g)',
    unitWeightG: 33,
    caloriesPerUnit: 17,
    proteinPerUnit: 3.6,
    carbsPerUnit: 0.2,
    fatPerUnit: 0.1,
    fiberPerUnit: 0,
    synonyms: ['egg white', 'egg whites', 'boiled egg white', 'boiled egg whites']
  },
  chicken_breast: {
    defaultUnit: '100g cooked',
    unitWeightG: 100,
    caloriesPerUnit: 165,
    proteinPerUnit: 31.0,
    carbsPerUnit: 0,
    fatPerUnit: 3.6,
    fiberPerUnit: 0,
    synonyms: ['chicken', 'chicken breast', 'grilled chicken', 'baked chicken', 'boiled chicken', 'cooked chicken']
  },
  salmon: {
    defaultUnit: '150g cooked',
    unitWeightG: 150,
    caloriesPerUnit: 310,
    proteinPerUnit: 34.0,
    carbsPerUnit: 0,
    fatPerUnit: 18.0,
    fiberPerUnit: 0,
    synonyms: ['salmon', 'salmon fillet', 'fish', 'grilled salmon']
  },
  tuna: {
    defaultUnit: 'can (140g drained)',
    unitWeightG: 140,
    caloriesPerUnit: 130,
    proteinPerUnit: 29.0,
    carbsPerUnit: 0,
    fatPerUnit: 1.0,
    fiberPerUnit: 0,
    synonyms: ['tuna', 'canned tuna', 'tuna fish']
  },
  whey_protein: {
    defaultUnit: '1 scoop (30g)',
    unitWeightG: 30,
    caloriesPerUnit: 120,
    proteinPerUnit: 24.0,
    carbsPerUnit: 1.5,
    fatPerUnit: 1.0,
    fiberPerUnit: 0,
    synonyms: ['whey', 'whey protein', 'protein powder', 'scoop of protein', 'protein shake', 'isolate', 'scoop of whey']
  },
  tofu: {
    defaultUnit: '100g',
    unitWeightG: 100,
    caloriesPerUnit: 83,
    proteinPerUnit: 10.0,
    carbsPerUnit: 2.0,
    fatPerUnit: 5.0,
    fiberPerUnit: 1.0,
    synonyms: ['tofu', 'firm tofu', 'soy paneer', 'bean curd']
  },

  // ==========================================
  // CARBOHYDRATES & GRAINS
  // ==========================================
  oats: {
    defaultUnit: 'bowl (50g raw)',
    unitWeightG: 50,
    caloriesPerUnit: 190,
    proteinPerUnit: 6.5,
    carbsPerUnit: 34.0,
    fatPerUnit: 3.0,
    fiberPerUnit: 5.0,
    synonyms: ['oats', 'oatmeal', 'rolled oats', 'porridge', 'bowl of oats']
  },
  bread_slice: {
    defaultUnit: 'slice (30g)',
    unitWeightG: 30,
    caloriesPerUnit: 80,
    proteinPerUnit: 3.5,
    carbsPerUnit: 14.0,
    fatPerUnit: 1.0,
    fiberPerUnit: 1.8,
    synonyms: ['bread', 'slice of bread', 'toast', 'brown bread', 'whole wheat bread', 'white bread', 'slices of bread', 'toasts']
  },
  rice_cooked: {
    defaultUnit: '1 cup cooked (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 195,
    proteinPerUnit: 4.2,
    carbsPerUnit: 43.0,
    fatPerUnit: 0.4,
    fiberPerUnit: 0.6,
    synonyms: ['rice', 'white rice', 'cooked rice', 'jasmine rice', 'basmati rice', 'brown rice', 'cup of rice', 'bowl of rice', 'chawal']
  },
  sweet_potato: {
    defaultUnit: 'medium (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 135,
    proteinPerUnit: 2.3,
    carbsPerUnit: 31.0,
    fatPerUnit: 0.2,
    fiberPerUnit: 4.5,
    synonyms: ['sweet potato', 'boiled sweet potato', 'shakarkandi']
  },
  potato: {
    defaultUnit: 'medium (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 130,
    proteinPerUnit: 3.0,
    carbsPerUnit: 30.0,
    fatPerUnit: 0.2,
    fiberPerUnit: 2.5,
    synonyms: ['potato', 'boiled potato', 'aloo', 'potatoes']
  },

  // ==========================================
  // FRUITS, NUTS & HEALTHY FATS
  // ==========================================
  banana: {
    defaultUnit: 'medium (118g)',
    unitWeightG: 118,
    caloriesPerUnit: 105,
    proteinPerUnit: 1.3,
    carbsPerUnit: 27.0,
    fatPerUnit: 0.3,
    fiberPerUnit: 3.1,
    synonyms: ['banana', 'bananas', 'medium banana', '1 banana', 'kela']
  },
  apple: {
    defaultUnit: 'medium (182g)',
    unitWeightG: 182,
    caloriesPerUnit: 95,
    proteinPerUnit: 0.5,
    carbsPerUnit: 25.0,
    fatPerUnit: 0.3,
    fiberPerUnit: 4.4,
    synonyms: ['apple', 'apples', 'green apple', 'red apple', 'seb']
  },
  peanut_butter: {
    defaultUnit: 'tbsp (16g)',
    unitWeightG: 16,
    caloriesPerUnit: 95,
    proteinPerUnit: 4.0,
    carbsPerUnit: 3.5,
    fatPerUnit: 8.0,
    fiberPerUnit: 1.0,
    synonyms: ['peanut butter', 'pb', 'almond butter', 'nut butter', 'spoon of peanut butter']
  },
  almonds: {
    defaultUnit: 'handful (28g / ~23 nuts)',
    unitWeightG: 28,
    caloriesPerUnit: 164,
    proteinPerUnit: 6.0,
    carbsPerUnit: 6.0,
    fatPerUnit: 14.0,
    fiberPerUnit: 3.5,
    synonyms: ['almonds', 'almond', 'badam', 'nuts']
  },
  walnuts: {
    defaultUnit: 'handful (28g)',
    unitWeightG: 28,
    caloriesPerUnit: 185,
    proteinPerUnit: 4.3,
    carbsPerUnit: 3.9,
    fatPerUnit: 18.5,
    fiberPerUnit: 1.9,
    synonyms: ['walnuts', 'walnut', 'akhrot']
  },
  avocado: {
    defaultUnit: 'half (100g)',
    unitWeightG: 100,
    caloriesPerUnit: 160,
    proteinPerUnit: 2.0,
    carbsPerUnit: 8.5,
    fatPerUnit: 14.7,
    fiberPerUnit: 6.7,
    synonyms: ['avocado', 'half avocado', 'butter fruit']
  },
  blueberries: {
    defaultUnit: 'cup (148g)',
    unitWeightG: 148,
    caloriesPerUnit: 84,
    proteinPerUnit: 1.1,
    carbsPerUnit: 21.0,
    fatPerUnit: 0.5,
    fiberPerUnit: 3.6,
    synonyms: ['blueberries', 'blueberry', 'berries']
  },

  // ==========================================
  // VEGETABLES & BEVERAGES
  // ==========================================
  broccoli: {
    defaultUnit: '1 cup (91g)',
    unitWeightG: 91,
    caloriesPerUnit: 31,
    proteinPerUnit: 2.6,
    carbsPerUnit: 6.0,
    fatPerUnit: 0.3,
    fiberPerUnit: 2.4,
    synonyms: ['broccoli', 'steamed broccoli', 'cup of broccoli']
  },
  spinach: {
    defaultUnit: '2 cups (60g)',
    unitWeightG: 60,
    caloriesPerUnit: 14,
    proteinPerUnit: 1.7,
    carbsPerUnit: 2.2,
    fatPerUnit: 0.2,
    fiberPerUnit: 1.3,
    synonyms: ['spinach', 'palak', 'baby spinach']
  },
  salad: {
    defaultUnit: 'bowl (150g)',
    unitWeightG: 150,
    caloriesPerUnit: 45,
    proteinPerUnit: 2.0,
    carbsPerUnit: 9.0,
    fatPerUnit: 0.5,
    fiberPerUnit: 3.0,
    synonyms: ['salad', 'green salad', 'mixed salad', 'cucumber and tomato', 'bowl of salad']
  },
  coffee: {
    defaultUnit: 'cup (250ml)',
    unitWeightG: 250,
    caloriesPerUnit: 35,
    proteinPerUnit: 1.5,
    carbsPerUnit: 4.0,
    fatPerUnit: 1.5,
    fiberPerUnit: 0,
    synonyms: ['coffee', 'cup of coffee', 'latte', 'cappuccino', 'black coffee', 'espresso']
  },
  tea: {
    defaultUnit: 'cup (200ml)',
    unitWeightG: 200,
    caloriesPerUnit: 40,
    proteinPerUnit: 1.5,
    carbsPerUnit: 5.0,
    fatPerUnit: 1.5,
    fiberPerUnit: 0,
    synonyms: ['tea', 'chai', 'cup of tea', 'milk tea', 'green tea', 'cup of chai']
  }
};

// Natural language parser & multiplier detector
function extractQuantityAndName(phrase: string): { quantity: number; unit?: string; cleanText: string } {
  const trimmed = phrase.trim().toLowerCase();
  
  // Word to number mapping
  const wordNumbers: Record<string, number> = {
    'one': 1, 'a': 1, 'an': 1, 'single': 1,
    'two': 2, 'double': 2, 'couple': 2,
    'three': 3, 'triple': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'half': 0.5, 'quarter': 0.25
  };

  // Match leading numbers e.g. "2.5", "2", "300ml", "100g", "2 scoops", "2 glasses", "2 slices", "2 idlis", "3 rotis"
  const numRegex = /^(\d+(\.\d+)?)\s*(cups?|glasses?|slices?|scoops?|tbsp?|tablespoons?|tsp?|teaspoons?|pieces?|pcs?|bowls?|plates?|idlis?|idlies?|rotis?|chapatis?|phulkas?|dosas?|parathas?|grams?|g|ml|liters?|l)?\s*(of\s+)?(.*)/i;
  const match = trimmed.match(numRegex);

  if (match) {
    const qty = parseFloat(match[1]) || 1;
    const unit = match[3]?.toLowerCase();
    const rest = match[5]?.trim() || '';

    return { quantity: qty, unit, cleanText: rest.length > 0 ? rest : trimmed };
  }

  // Check word numbers like "two glasses of milk" or "two rotis"
  const words = trimmed.split(' ');
  if (wordNumbers[words[0]] !== undefined) {
    const qty = wordNumbers[words[0]];
    const unitMatch = words[1]?.match(/^(cups?|glasses?|slices?|scoops?|pieces?|bowls?|plates?|idlis?|rotis?|chapatis?|dosas?)/i);
    const unit = unitMatch ? unitMatch[1].toLowerCase() : undefined;
    const restWords = words.slice(unit ? 2 : 1).join(' ').replace(/^of\s+/i, '');
    return { quantity: qty, unit, cleanText: restWords };
  }

  return { quantity: 1, cleanText: trimmed };
}

// Find best matching food in knowledge base with priority to longest matching synonym
function matchFood(queryText: string): { key: string; item: typeof FOOD_KNOWLEDGE_BASE[string] } | null {
  const clean = queryText.toLowerCase().trim();
  if (!clean) return null;

  // 1. Exact match on synonyms
  for (const [key, food] of Object.entries(FOOD_KNOWLEDGE_BASE)) {
    if (food.synonyms.some(s => s === clean)) {
      return { key, item: food };
    }
  }

  // 2. Substring match, sorted by longest synonym first (e.g. "masala dosa" matches before "dosa", "dal makhani" before "dal")
  const candidates: Array<{ key: string; item: typeof FOOD_KNOWLEDGE_BASE[string]; synLength: number }> = [];
  
  for (const [key, food] of Object.entries(FOOD_KNOWLEDGE_BASE)) {
    for (const s of food.synonyms) {
      if (clean.includes(s) || s.includes(clean)) {
        candidates.push({ key, item: food, synLength: s.length });
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.synLength - a.synLength);
    return { key: candidates[0].key, item: candidates[0].item };
  }

  // 3. Token-level fuzzy match
  for (const [key, food] of Object.entries(FOOD_KNOWLEDGE_BASE)) {
    for (const syn of food.synonyms) {
      const synTokens = syn.split(' ');
      if (synTokens.some(t => t.length > 2 && clean.includes(t))) {
        return { key, item: food };
      }
    }
  }

  return null;
}

/**
 * Main AI Meal Analyzer function
 * Takes raw text like "2 idli with 1 bowl sambar, 2 boiled eggs, and 1 glass milk"
 * and returns structured macro calculation.
 */
export function analyzeMealText(rawText: string): AIMealAnalysisResult {
  if (!rawText || !rawText.trim()) {
    return {
      rawQuery: '',
      mealTitle: 'Empty Meal',
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      components: [],
      healthNotes: ['Please provide food items to analyze.'],
      confidence: 'Estimated'
    };
  }

  // Split input by commas, 'and', 'with', '+', or newlines
  const phrases = rawText
    .split(/,|\band\b|\bwith\b|\+|\n/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const components: ParsedFoodComponent[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let hasGenericEstimate = false;

  for (const phrase of phrases) {
    const { quantity: rawQuantity, unit, cleanText } = extractQuantityAndName(phrase);
    const matched = matchFood(cleanText);

    if (matched) {
      const food = matched.item;
      let multiplier = rawQuantity;
      let displayUnit = food.defaultUnit;

      if (unit === 'g' || unit === 'grams') {
        multiplier = rawQuantity / (food.unitWeightG || 100);
        displayUnit = `${rawQuantity}g`;
      } else if (unit === 'ml') {
        multiplier = rawQuantity / (food.unitWeightG || 250);
        displayUnit = `${rawQuantity}ml`;
      } else if (unit === 'l' || unit === 'liter' || unit === 'liters') {
        multiplier = (rawQuantity * 1000) / (food.unitWeightG || 250);
        displayUnit = `${rawQuantity}L`;
      } else if (unit) {
        displayUnit = `${rawQuantity} ${unit}`;
      }

      const cals = Math.round(food.caloriesPerUnit * multiplier);
      const pro = Math.round(food.proteinPerUnit * multiplier * 10) / 10;
      const carbs = Math.round(food.carbsPerUnit * multiplier * 10) / 10;
      const fat = Math.round(food.fatPerUnit * multiplier * 10) / 10;
      const fiber = Math.round(food.fiberPerUnit * multiplier * 10) / 10;

      totalCalories += cals;
      totalProtein += pro;
      totalCarbs += carbs;
      totalFat += fat;
      totalFiber += fiber;

      components.push({
        name: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
        quantity: Math.round(rawQuantity * 10) / 10,
        unit: displayUnit,
        calories: cals,
        protein: pro,
        carbs: carbs,
        fat: fat,
        fiber: fiber
      });
    } else {
      // Flag as unrecognized food rather than manufacturing fake 180 kcal data
      hasGenericEstimate = true;

      components.push({
        name: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
        quantity: Math.round(rawQuantity * 10) / 10,
        unit: 'serving',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        isUnknown: true,
        isEstimated: false
      });
    }
  }

  // Generate actionable AI Health & Macro Notes
  const notes: string[] = [];
  const proteinPercent = totalCalories > 0 ? Math.round(((totalProtein * 4) / totalCalories) * 100) : 0;

  if (hasGenericEstimate) {
    notes.push('⚠️ Unrecognized item detected. Please choose to search food, enter manually, or estimate with AI.');
  }

  if (proteinPercent >= 30) {
    notes.push(`High Protein Density (${proteinPercent}% of calories) — optimal for muscle protein synthesis.`);
  } else if (proteinPercent > 0 && proteinPercent < 18) {
    notes.push(`Low Protein Ratio (${proteinPercent}%). Consider adding eggs, whey, paneer, or Greek yogurt.`);
  }

  return {
    rawQuery: rawText,
    mealTitle: components.length > 0 ? components.map(c => c.name).slice(0, 3).join(', ') : 'Custom Meal',
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalFiber: Math.round(totalFiber * 10) / 10,
    components,
    healthNotes: notes.length > 0 ? notes : ['Macros synthesized and calculated via FitForge engine.'],
    confidence: hasGenericEstimate ? 'Estimated' : 'High',
    hasUnknownItems: hasGenericEstimate
  };
}
