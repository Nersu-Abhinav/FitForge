

export const CANONICAL_EXERCISES = [
  // =========================================================================
  // 1. CHEST
  // =========================================================================
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '5 - 8 reps',
    instructions: [
      'Lie flat on bench with eyes directly under the bar.',
      'Grip barbell slightly wider than shoulder-width with wrists straight.',
      'Unrack, plant feet firmly, retract scapulae, and lower bar under control to mid-chest.',
      'Press powerfully upward until arms are extended without unlocking shoulders.'
    ],
    formCues: ['Drive through heels', 'Keep shoulder blades squeezed', 'Tuck elbows at ~45°', 'Do not bounce off chest'],
    commonMistakes: ['Flaring elbows to 90°', 'Lifting hips off the bench', 'Uneven pressing speed']
  },
  {
    id: 'ex-incline-db-press',
    name: 'Incline Dumbbell Press',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Set bench to 30° angle. Sit with dumbbells resting on thighs.',
      'Kick dumbbells up to shoulder level as you lean back.',
      'Press upward in a slight arc, bringing dumbbells close at the peak.',
      'Lower under control until you feel a deep stretch in the upper pecs.'
    ],
    formCues: ['30 degree bench angle is optimal for clavicular head', 'Keep wrists neutral', 'Full stretch at bottom'],
    commonMistakes: ['Setting bench angle too high (>45°)', 'Dropping weights rapidly']
  },
  {
    id: 'ex-incline-bb-press',
    name: 'Incline Barbell Bench Press',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '6 - 10 reps',
    instructions: [
      'Set bench to 30-45° angle under rack.',
      'Grip bar slightly wider than shoulder width.',
      'Lower bar with control to upper chest (clavicle area).',
      'Drive straight up locking out arms.'
    ],
    formCues: ['Keep upper back pinned to pad', 'Touch upper chest softly', 'Maintain wrist alignment'],
    commonMistakes: ['Arching lower back off the pad excessively', 'Pressing with elbows excessively flared']
  },
  {
    id: 'ex-decline-bb-press',
    name: 'Decline Barbell Bench Press',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 10 reps',
    instructions: [
      'Secure legs in decline bench rollers and lie back.',
      'Grip barbell slightly wider than shoulders.',
      'Lower bar to lower chest line under control.',
      'Press vertically back to lockout.'
    ],
    formCues: ['Squeeze lower pecs at peak', 'Keep scapulae retracted throughout'],
    commonMistakes: ['Uncontrolled descent towards neck']
  },
  {
    id: 'ex-flat-db-press',
    name: 'Flat Dumbbell Bench Press',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Lie flat holding dumbbells over chest with neutral/semi-pronated grip.',
      'Lower weights until upper arms are just below parallel to floor.',
      'Press up while converging dumbbells slightly at top.'
    ],
    formCues: ['Full stretch at bottom', 'Converge without clanking weights at top'],
    commonMistakes: ['Dropping elbows too low causing shoulder strain']
  },
  {
    id: 'ex-cable-fly',
    name: 'Standing Cable Fly',
    category: 'Isolation',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Set pulleys at chest height. Take one handle in each hand and step forward.',
      'Maintain a slight bend in elbows and bring hands together in a hugging motion.',
      'Squeeze chest hard for 1 second at full contraction.',
      'Slowly return to start position until you feel a full pectoral stretch.'
    ],
    formCues: ['Think of hugging a large tree', 'Lock elbow angle throughout the movement', 'Keep core tight'],
    commonMistakes: ['Turning movement into a press', 'Using momentum to swing cables']
  },
  {
    id: 'ex-low-to-high-cable-fly',
    name: 'Low-to-High Cable Crossover',
    category: 'Isolation',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Set pulleys to the lowest position.',
      'Step forward with palms facing forward.',
      'Bring hands upward and together in front of upper chest in an upward scoop.',
      'Squeeze upper pecs at peak for 1 second.'
    ],
    formCues: ['Focus on clavicular head contraction', 'Keep elbows slightly bent'],
    commonMistakes: ['Using shoulders to yank cables up']
  },
  {
    id: 'ex-pec-deck',
    name: 'Pec Deck Machine',
    category: 'Isolation',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 15 reps',
    instructions: [
      'Adjust seat so handles align with mid-chest level.',
      'Keep back flat against pad, grip handles, and bring arms together in front.',
      'Hold contraction for 1 second, then control back to start.'
    ],
    formCues: ['Chest proud', 'Focus on mind-muscle connection', 'Smooth tempo (3-0-1)'],
    commonMistakes: ['Rounding shoulders forward at contraction']
  },
  {
    id: 'ex-dips',
    name: 'Chest Dips',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Grip parallel dip bars and suspend yourself.',
      'Lean torso forward 20-30° to emphasize pecs over triceps.',
      'Lower body until shoulders are below elbows, then press up firmly.'
    ],
    formCues: ['Lean torso forward', 'Flare elbows slightly out for chest focus', 'Controlled negative'],
    commonMistakes: ['Staying completely upright (shifts load to triceps)', 'Going too shallow']
  },
  {
    id: 'ex-pushups',
    name: 'Push-Ups',
    category: 'Compound',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Core', 'Front Delts'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    recommendedRepRange: '15 - 25 reps',
    instructions: [
      'Place hands slightly wider than shoulder width on the floor.',
      'Form a straight plank line from head to heels.',
      'Lower chest until 1 inch from floor, then press back up.'
    ],
    formCues: ['Glutes and core squeezed tight', 'Elbows at 45 degree angle'],
    commonMistakes: ['Sagging hips', 'Flaring elbows out at 90 degrees']
  },

  // =========================================================================
  // 2. BACK / LATS / UPPER BACK
  // =========================================================================
  {
    id: 'ex-deadlift',
    name: 'Barbell Deadlift',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Traps', 'Forearms'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '3 - 6 reps',
    instructions: [
      'Stand with mid-foot under barbell, feet hip-width.',
      'Hinge at hips, grip bar just outside shins, pull chest up and brace lats.',
      'Drive through floor with legs, keeping bar glued to body until standing tall.',
      'Hinge hips back and lower bar under control.'
    ],
    formCues: ['Pack lats tight', 'Push the floor away', 'Lockout with glutes, not lower back lean'],
    commonMistakes: ['Rounding lower back', 'Yanking bar off floor without tension']
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Lat Pulldown (Wide Grip)',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Sit comfortably with thigh pads locked snug against legs.',
      'Grip wide bar with overhand grip slightly outside shoulder width.',
      'Pull bar down smoothly toward upper chest while driving elbows downward and back.',
      'Control bar back to starting position with full lat stretch at the top.'
    ],
    formCues: ['Lead with elbows', 'Depress shoulder blades first', 'Avoid leaning excessively back'],
    commonMistakes: ['Swinging torso backwards for momentum', 'Pulling bar behind neck']
  },
  {
    id: 'ex-neutral-lat-pulldown',
    name: 'Neutral Grip Lat Pulldown',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Brachialis'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Attach close-grip V-bar or parallel bar.',
      'Pull down directly towards clavicle while keeping elbows tucked in close to torso.',
      'Feel deep lat contraction at bottom.'
    ],
    formCues: ['Drive elbows straight down', 'Chest proud at peak squeeze'],
    commonMistakes: ['Rounding upper back']
  },
  {
    id: 'ex-barbell-row',
    name: 'Bent Over Barbell Row',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Erectors', 'Traps'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '6 - 10 reps',
    instructions: [
      'Stand hip-width apart, hinge at hips until torso is ~45° to floor with neutral spine.',
      'Grip barbell overhand just outside knees.',
      'Pull barbell toward lower ribcage/navel, squeezing back muscles at peak.',
      'Lower barbell smoothly under full control.'
    ],
    formCues: ['Brace core like taking a punch', 'Keep neck in neutral alignment', 'Pull to hips, not chest'],
    commonMistakes: ['Rounding the lumbar spine', 'Standing up too high during the set']
  },
  {
    id: 'ex-pull-up',
    name: 'Pull-Up',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Brachialis', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Advanced',
    recommendedRepRange: '6 - 12 reps',
    instructions: [
      'Hang from overhead bar with hands wider than shoulder-width, palms facing away.',
      'Depress scapulae and pull chest up toward the bar until chin clears bar.',
      'Lower with strict control to a dead hang.'
    ],
    formCues: ['Drive elbows into back pockets', 'Do not kip or swing', 'Full range of motion'],
    commonMistakes: ['Kicking legs for momentum', 'Half reps avoiding bottom stretch']
  },
  {
    id: 'ex-chin-up',
    name: 'Chin-Up',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    recommendedRepRange: '6 - 12 reps',
    instructions: [
      'Hang from pull-up bar with palms facing towards you (supinated grip) shoulder-width apart.',
      'Pull body up until chin clears bar, driving biceps and lats.',
      'Lower under complete control.'
    ],
    formCues: ['Full extension at bottom', 'Squeeze biceps at top'],
    commonMistakes: ['Using swinging momentum']
  },
  {
    id: 'ex-seated-cable-row',
    name: 'Seated Cable Row',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Traps'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Sit with knees slightly bent, feet on footplates, gripping V-bar attachment.',
      'Sit upright with chest tall and core braced.',
      'Pull attachment into lower abdomen while pulling shoulder blades together.',
      'Slowly extend arms forward for a full stretch.'
    ],
    formCues: ['Keep spine vertical', 'Full scapular squeeze at contraction', 'Smooth cadence'],
    commonMistakes: ['Hyperextending lower back at end of rep']
  },
  {
    id: 'ex-single-arm-db-row',
    name: 'One-Arm Dumbbell Row',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Core'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Place one knee and hand on a flat bench with other foot planted wide.',
      'Hold dumbbell with free hand hanging straight down.',
      'Row dumbbell up toward hip while keeping back parallel to floor.',
      'Lower under tension.'
    ],
    formCues: ['Row along an arc toward hip', 'Keep shoulders square to the bench'],
    commonMistakes: ['Rotating torso excessively to heave weight']
  },
  {
    id: 'ex-t-bar-row',
    name: 'T-Bar Row',
    category: 'Compound',
    muscleGroup: 'Back',
    secondaryMuscles: ['Traps', 'Rhomboids', 'Biceps'],
    equipment: 'Machine',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Straddle T-bar platform with torso hinged at 45° angle.',
      'Grip handles and pull weight towards chest/abdomen.',
      'Squeeze shoulder blades hard at top and lower under control.'
    ],
    formCues: ['Chest supported if using machine', 'Brace lumbar spine'],
    commonMistakes: ['Using leg drive to throw the weight']
  },
  {
    id: 'ex-straight-arm-pulldown',
    name: 'Straight-Arm Cable Pulldown',
    category: 'Isolation',
    muscleGroup: 'Back',
    secondaryMuscles: ['Triceps (Long Head)', 'Core'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Attach straight bar or rope to high cable.',
      'Step back with slight forward torso hinge and arms almost straight.',
      'Sweep arms downward in an arc towards thighs using pure lat contraction.',
      'Pause at thighs and slowly return overhead.'
    ],
    formCues: ['Lock elbow bend at ~10° throughout', 'Feel full lat sweep'],
    commonMistakes: ['Bending elbows and turning into tricep pushdown']
  },
  {
    id: 'ex-bb-shrug',
    name: 'Barbell Shrugs',
    category: 'Isolation',
    muscleGroup: 'Back',
    secondaryMuscles: ['Traps', 'Forearms'],
    equipment: 'Barbell',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 15 reps',
    instructions: [
      'Stand holding barbell at thighs shoulder-width.',
      'Elevate shoulders straight up towards ears in a shrugging motion.',
      'Hold peak trap contraction for 1 second, then lower slowly.'
    ],
    formCues: ['Shrug straight up and down', 'Do NOT roll shoulders in circles'],
    commonMistakes: ['Rolling shoulders backwards (injures rotator cuff)']
  },

  // =========================================================================
  // 3. SHOULDERS / DELTOIDS
  // =========================================================================
  {
    id: 'ex-overhead-press',
    name: 'Standing Overhead Press (OHP)',
    category: 'Compound',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '5 - 8 reps',
    instructions: [
      'Grip bar at shoulder-width resting on front delts/clavicle.',
      'Brace glutes, abs, and quads.',
      'Press barbell vertically, tilting head slightly back to clear chin, then pushing head through window at top.',
      'Lock out overhead and lower back under control.'
    ],
    formCues: ['Squeeze glutes rock hard', 'Bar path travels in straight vertical line', 'Do not arch lower back'],
    commonMistakes: ['Excessive backward lumbar lean', 'Grip too wide']
  },
  {
    id: 'ex-db-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'Compound',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Sit on bench with vertical back support, dumbbells at ear height.',
      'Press dumbbells overhead until arms are nearly straight.',
      'Lower dumbbells until handles are level with ears.'
    ],
    formCues: ['Palms angled slightly inward (30° scapular plane)', 'Keep elbows under wrists'],
    commonMistakes: ['Flaring elbows straight out to the sides']
  },
  {
    id: 'ex-arnold-press',
    name: 'Arnold Press',
    category: 'Compound',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Start seated holding dumbbells at chest level with palms facing you (supinated).',
      'As you press upward, rotate wrists outward so palms face forward at lockout.',
      'Reverse rotation smoothly on the way down.'
    ],
    formCues: ['Fluid continuous rotation', 'Smooth tempo'],
    commonMistakes: ['Jerking weights during rotation']
  },
  {
    id: 'ex-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'Isolation',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Traps'],
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Stand with dumbbells at sides with slight forward torso lean.',
      'Raise dumbbells out to the sides leading with elbows until parallel with floor.',
      'Pause for a split second, then lower slowly over 2-3 seconds.'
    ],
    formCues: ['Lead with elbows', 'Slight forward arm angle (scapular plane)', 'Control the eccentric'],
    commonMistakes: ['Using body swing/momentum', 'Shrugging traps up to ears']
  },
  {
    id: 'ex-cable-lateral-raise',
    name: 'Cable Lateral Raise',
    category: 'Isolation',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Lateral Delts'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Set low pulley behind or in front of body.',
      'Raise cable handle out to side until arm is parallel to floor.',
      'Constant tension provides continuous resistance throughout entire range.'
    ],
    formCues: ['Control negative', 'Keep wrist locked'],
    commonMistakes: ['Using leg bounce']
  },
  {
    id: 'ex-face-pull',
    name: 'Cable Face Pull',
    category: 'Isolation',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Rear Delts', 'Rotator Cuff', 'Rhomboids'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '15 - 20 reps',
    instructions: [
      'Attach rope to high pulley. Grip rope with thumbs pointing backward.',
      'Step back, pull rope directly towards eyes/forehead while separating hands.',
      'Externally rotate shoulders so knuckles point up and back.',
      'Squeeze rear delts and upper back hard at contraction.'
    ],
    formCues: ['Pull thumbs past ears', 'Keep elbows high', 'Light weight with strict squeeze'],
    commonMistakes: ['Using too much weight and turning into a row']
  },
  {
    id: 'ex-rear-delt-fly',
    name: 'Reverse Pec Deck (Rear Delt Fly)',
    category: 'Isolation',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Rear Delts', 'Rhomboids'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Sit facing pec deck machine with chest against pad.',
      'Grip vertical or horizontal handles with arms straight.',
      'Pull arms back in an arc squeezing rear delts.',
      'Hold contraction for 1 second, then return.'
    ],
    formCues: ['Lead with back of elbows', 'Keep chest glued to pad'],
    commonMistakes: ['Using traps instead of rear deltoids']
  },

  // =========================================================================
  // 4. BICEPS
  // =========================================================================
  {
    id: 'ex-barbell-curl',
    name: 'Standing Barbell Bicep Curl',
    category: 'Isolation',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms', 'Brachialis'],
    equipment: 'Barbell',
    difficulty: 'Beginner',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Stand tall holding barbell with underhand grip shoulder-width apart.',
      'Keep elbows pinned to ribs and curl barbell upward toward shoulders.',
      'Squeeze biceps at peak for 1 second.',
      'Lower barbell under control for 2-3 seconds.'
    ],
    formCues: ['Elbows stay stationary like a hinge', 'Do not rock hips or back', 'Full extension at bottom'],
    commonMistakes: ['Swinging torso backward', 'Letting elbows drift forward']
  },
  {
    id: 'ex-incline-db-curl',
    name: 'Incline Dumbbell Curl',
    category: 'Isolation',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Sit on bench angled at 45-60° with dumbbells hanging straight down.',
      'Curl dumbbells upward while supinating wrists (palms up).',
      'Lower slowly to feel a deep long-head bicep stretch.'
    ],
    formCues: ['Keep elbows behind torso', 'Emphasize bottom stretch'],
    commonMistakes: ['Swinging dumbbells up']
  },
  {
    id: 'ex-preacher-curl',
    name: 'EZ-Bar Preacher Curl',
    category: 'Isolation',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Brachialis'],
    equipment: 'Barbell',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Sit at preacher bench with armpits resting snug over top of pad.',
      'Grip inner EZ-bar curves and curl upward.',
      'Lower under strict control without slamming elbows at bottom.'
    ],
    formCues: ['Do not hyperextend at bottom', 'Strict isolation with zero momentum'],
    commonMistakes: ['Lifting body off seat to heave bar']
  },
  {
    id: 'ex-hammer-curl',
    name: 'Dumbbell Hammer Curl',
    category: 'Isolation',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Brachioradialis', 'Forearms'],
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Stand holding dumbbells with palms facing each other (neutral grip).',
      'Curl dumbbells upward maintaining neutral grip throughout.',
      'Squeeze forearm and outer bicep peak, then lower smoothly.'
    ],
    formCues: ['Thumbs pointing up throughout', 'Controlled negative'],
    commonMistakes: ['Flaring elbows out to sides']
  },
  {
    id: 'ex-cable-rope-curl',
    name: 'Cable Rope Hammer Curl',
    category: 'Isolation',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Attach rope to low cable pulley.',
      'Grip rope ends and curl upward, spreading rope ends slightly at top.',
      'Lower slowly against constant cable tension.'
    ],
    formCues: ['Spread rope at peak contraction', 'Keep elbows stationary'],
    commonMistakes: ['Leaning back']
  },

  // =========================================================================
  // 5. TRICEPS
  // =========================================================================
  {
    id: 'ex-rope-pushdown',
    name: 'Cable Tricep Rope Pushdown',
    category: 'Isolation',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Attach rope to high pulley, grip ends with neutral grip.',
      'Pin elbows to sides of ribcage and lean forward slightly.',
      'Push rope straight down, flaring rope ends apart at the bottom lockout.',
      'Squeeze triceps for 1 second, then control back to elbow 90° bend.'
    ],
    formCues: ['Spread rope ends at bottom lockout', 'Elbows remain locked in space', 'Do not let shoulders roll forward'],
    commonMistakes: ['Using bodyweight to press down', 'Letting elbows flare forward on negative']
  },
  {
    id: 'ex-straight-bar-pushdown',
    name: 'Straight-Bar Cable Pushdown',
    category: 'Isolation',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Attach straight bar to high cable.',
      'Grip overhand shoulder-width and push straight down until arms lock out.',
      'Return bar to chest level under control.'
    ],
    formCues: ['Overhand grip', 'Pin elbows to ribs'],
    commonMistakes: ['Letting elbows wander back and forth']
  },
  {
    id: 'ex-skull-crushers',
    name: 'Skull Crushers (EZ-Bar)',
    category: 'Isolation',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Lie flat on bench holding EZ-bar overhead with arms angled slightly backward (~10°).',
      'Bend at elbows to lower bar toward forehead/top of head.',
      'Extend elbows powerfully to return bar to start position.'
    ],
    formCues: ['Angled arms keep constant tension on long head', 'Keep elbows tucked'],
    commonMistakes: ['Flaring elbows wide', 'Dropping bar too fast towards head']
  },
  {
    id: 'ex-overhead-cable-extension',
    name: 'Overhead Cable Tricep Extension',
    category: 'Isolation',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Long Head Triceps'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Attach rope to mid/high pulley. Step forward with torso hinged at 45°.',
      'Extend arms overhead in front, spreading rope at lockout.',
      'Allow rope to return behind head for full triceps long head stretch.'
    ],
    formCues: ['Deep stretch behind neck', 'Keep upper arms stable'],
    commonMistakes: ['Moving shoulders instead of elbows']
  },
  {
    id: 'ex-close-grip-bench',
    name: 'Close-Grip Barbell Bench Press',
    category: 'Compound',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Chest', 'Front Delts'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '6 - 10 reps',
    instructions: [
      'Lie on flat bench, grip barbell shoulder-width apart (hands ~14 inches apart).',
      'Lower bar to lower sternum while keeping elbows tucked close to torso.',
      'Press up locking out triceps.'
    ],
    formCues: ['Grip shoulder-width (do NOT put hands touching)', 'Keep elbows tight to ribs'],
    commonMistakes: ['Gripping too close causing wrist pain']
  },

  // =========================================================================
  // 6. QUADS
  // =========================================================================
  {
    id: 'ex-back-squat',
    name: 'Barbell Back Squat',
    category: 'Compound',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core', 'Erectors'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '5 - 8 reps',
    instructions: [
      'Rest barbell securely across upper traps (high bar) or rear delts (low bar).',
      'Set feet shoulder-width with toes pointed slightly outward (15-30°).',
      'Take deep breath into abdomen, brace core, and sit hips down and back.',
      'Descend until hip crease is below top of knees (parallel or deeper).',
      'Drive aggressively through mid-foot and stand tall.'
    ],
    formCues: ['Chest tall', 'Knees track over toes', 'Drive hips up out of the hole', 'Keep heels grounded'],
    commonMistakes: ['Knees caving inward (valgus)', 'Heels lifting off floor', 'Rounding lower back at bottom']
  },
  {
    id: 'ex-front-squat',
    name: 'Barbell Front Squat',
    category: 'Compound',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Core', 'Upper Back', 'Glutes'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '6 - 8 reps',
    instructions: [
      'Rest bar across front delts in clean rack position with elbows high.',
      'Keep torso completely upright while squatting down to parallel.',
      'Drive up through quads keeping elbows pointing forward.'
    ],
    formCues: ['Elbows pointed high', 'Vertical torso throughout'],
    commonMistakes: ['Dropping elbows causing bar to roll forward']
  },
  {
    id: 'ex-leg-press',
    name: 'Leg Press Machine',
    category: 'Compound',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 15 reps',
    instructions: [
      'Sit firmly in leg press seat with lower back pinned to pad.',
      'Place feet shoulder-width in middle of sled.',
      'Release safety handles and lower sled until knees reach 90° bend.',
      'Press sled up without locking knees at top.'
    ],
    formCues: ['Keep lower back glued to seat', 'Do not lock out knees violently'],
    commonMistakes: ['Lifting hips/lower back off pad at bottom']
  },
  {
    id: 'ex-hack-squat',
    name: 'Hack Squat Machine',
    category: 'Compound',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Position back against pad and shoulders under pads.',
      'Place feet shoulder-width on platform.',
      'Squat down deeply to 90° or lower.',
      'Press up through midfoot to full extension.'
    ],
    formCues: ['Full depth knee flexion', 'Smooth control'],
    commonMistakes: ['Bouncing out of bottom']
  },
  {
    id: 'ex-leg-extension',
    name: 'Leg Extension Machine',
    category: 'Isolation',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Rectus Femoris'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Sit with back against pad, shin pad resting just above ankles.',
      'Extend legs upward until straight, squeezing quads hard at top.',
      'Lower weight slowly under complete control.'
    ],
    formCues: ['Pause 1 second at top extension', 'Controlled 3-second negative'],
    commonMistakes: ['Kicking weight up violently']
  },
  {
    id: 'ex-bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'Compound',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Stand 2 feet in front of a bench. Place one foot laces-down on the bench behind you.',
      'Hold dumbbells at sides.',
      'Lower rear knee toward floor until front thigh is parallel.',
      'Drive through front heel to stand up.'
    ],
    formCues: ['Most weight on front leg (85%)', 'Torso slightly pitched forward for balance'],
    commonMistakes: ['Front foot placed too close to bench']
  },

  // =========================================================================
  // 7. HAMSTRINGS
  // =========================================================================
  {
    id: 'ex-romanian-deadlift',
    name: 'Barbell Romanian Deadlift (RDL)',
    category: 'Compound',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back', 'Forearms'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 10 reps',
    instructions: [
      'Stand tall holding barbell with overhand grip at thighs.',
      'Keep knees soft with slight bend (15°) and hinge hips backwards.',
      'Lower bar along thighs until you feel a deep hamstring stretch just below knees.',
      'Drive hips forward and squeeze glutes to return to standing.'
    ],
    formCues: ['Push hips back to touch an imaginary wall', 'Keep bar scraping legs', 'Flat back throughout'],
    commonMistakes: ['Squatting down instead of hip hinging', 'Rounding the spine']
  },
  {
    id: 'ex-db-rdl',
    name: 'Dumbbell Romanian Deadlift',
    category: 'Compound',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back'],
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Hold dumbbells in front of thighs.',
      'Hinge at hips, pushing glutes backward while keeping dumbbells tight to shins.',
      'Feel deep stretch in hamstrings and drive hips forward to lockout.'
    ],
    formCues: ['Soft knees', 'Neutral neck alignment'],
    commonMistakes: ['Letting dumbbells drift away from body']
  },
  {
    id: 'ex-seated-leg-curl',
    name: 'Seated Leg Curl Machine',
    category: 'Isolation',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Calves'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 15 reps',
    instructions: [
      'Sit in machine with thigh pad secured tightly over quads.',
      'Curl heels downward and back underneath seat.',
      'Hold peak squeeze for 1 second, then control back up to full stretch.'
    ],
    formCues: ['Thigh pad must be snug', 'Full knee flexion and slow extension'],
    commonMistakes: ['Letting weight slam down']
  },
  {
    id: 'ex-lying-leg-curl',
    name: 'Lying Leg Curl Machine',
    category: 'Isolation',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Calves'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '10 - 12 reps',
    instructions: [
      'Lie face down with roller pad positioned just below calf muscles.',
      'Curl weight upward towards glutes.',
      'Lower with 3-second negative.'
    ],
    formCues: ['Keep hips pressed firmly into bench'],
    commonMistakes: ['Arching lower back off pad']
  },

  // =========================================================================
  // 8. GLUTES
  // =========================================================================
  {
    id: 'ex-hip-thrust',
    name: 'Barbell Hip Thrust',
    category: 'Compound',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Quads'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Sit on floor with upper back against bench and padded barbell over hips.',
      'Plant feet flat shoulder-width apart.',
      'Drive through heels and extend hips upward until thighs and torso form a straight line.',
      'Squeeze glutes hard at the top for 1 full second, then lower under control.'
    ],
    formCues: ['Chin tucked looking forward', 'Shins vertical at top of thrust', 'Lock out with glutes, not lumbar'],
    commonMistakes: ['Hyperextending lower back at top', 'Feet placed too far forward or too close']
  },
  {
    id: 'ex-cable-glute-kickback',
    name: 'Cable Glute Kickback',
    category: 'Isolation',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Attach ankle cuff to low pulley.',
      'Hinge forward slightly holding machine frame.',
      'Kick leg backward in an arc, squeezing glute at peak extension.',
      'Slowly return to start.'
    ],
    formCues: ['Keep lower back still', 'Drive movement with glute'],
    commonMistakes: ['Swinging lower back']
  },
  {
    id: 'ex-glute-hyper',
    name: '45° Glute-Hyperextension',
    category: 'Isolation',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Erectors'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Set 45° hyperextension bench so top pad is below hips.',
      'Turn toes out 45° and slightly round upper back.',
      'Hinge at hips, then raise torso using glute contraction.'
    ],
    formCues: ['Upper back rounded (takes lower back out)', 'Toes flared out'],
    commonMistakes: ['Arching lower back at top']
  },

  // =========================================================================
  // 9. CALVES
  // =========================================================================
  {
    id: 'ex-standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'Isolation',
    muscleGroup: 'Calves',
    secondaryMuscles: ['Gastrocnemius'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 20 reps',
    instructions: [
      'Stand with balls of feet on edge of platform, shoulder pads snug.',
      'Lower heels deeply into a full stretch (hold 2 seconds).',
      'Drive up onto tiptoes for a hard peak contraction.'
    ],
    formCues: ['Hold bottom stretch for 2 seconds to eliminate Achilles bounce', 'Full extension at top'],
    commonMistakes: ['Bouncing fast using tendon elasticity']
  },
  {
    id: 'ex-seated-calf-raise',
    name: 'Seated Calf Raise',
    category: 'Isolation',
    muscleGroup: 'Calves',
    secondaryMuscles: ['Soleus'],
    equipment: 'Machine',
    difficulty: 'Beginner',
    recommendedRepRange: '15 - 20 reps',
    instructions: [
      'Sit with knees under pads and balls of feet on platform.',
      'Lower heels below platform level, then push up onto toes.',
      'Targets the soleus muscle underneath the gastrocnemius.'
    ],
    formCues: ['Full stretch and peak squeeze', 'Controlled cadence'],
    commonMistakes: ['Rushing repetitions']
  },

  // =========================================================================
  // 10. ABS / CORE
  // =========================================================================
  {
    id: 'ex-hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Hip Flexors', 'Grip'],
    equipment: 'Bodyweight',
    difficulty: 'Advanced',
    recommendedRepRange: '10 - 15 reps',
    instructions: [
      'Hang from pull-up bar with straight arms and body still.',
      'Raise legs up until parallel to floor or touching bar, curling pelvis upward.',
      'Lower legs slowly without swinging.'
    ],
    formCues: ['Roll pelvis upward to engage rectus abdominis', 'Zero momentum'],
    commonMistakes: ['Swinging body back and forth']
  },
  {
    id: 'ex-cable-crunch',
    name: 'Cable Kneeling Crunch',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Obliques'],
    equipment: 'Cable',
    difficulty: 'Beginner',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Kneel below high pulley holding rope attachment at crown of head.',
      'Crunch ribcage down towards hips, rounding spine to flex abs.',
      'Hold contraction for 1 second, then control back up.'
    ],
    formCues: ['Flex spine, do not just sit back on heels', 'Keep hips stationary'],
    commonMistakes: ['Moving hips instead of flexing abdominal wall']
  },
  {
    id: 'ex-ab-wheel',
    name: 'Ab Wheel Rollout',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Lats', 'Shoulders'],
    equipment: 'Bodyweight',
    difficulty: 'Advanced',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Kneel on floor holding ab wheel handles.',
      'Roll wheel forward extending body into a long line without letting lower back sag.',
      'Pull back to start position by contracting abs.'
    ],
    formCues: ['Tuck pelvis (posterior pelvic tilt)', 'Do not let lower back arch'],
    commonMistakes: ['Sagging lower back causing lumbar stress']
  },
  {
    id: 'ex-plank',
    name: 'Plank',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Shoulders', 'Glutes'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    recommendedRepRange: '45 - 60 sec',
    instructions: [
      'Rest on forearms and toes forming a straight plank line.',
      'Squeeze abs, glutes, and quads actively.',
      'Hold position without sagging or piking hips.'
    ],
    formCues: ['Pull belly button to spine', 'Create full body tension'],
    commonMistakes: ['Sagging hips towards floor']
  },
  {
    id: 'ex-russian-twist',
    name: 'Weighted Russian Twist',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Obliques', 'Hip Flexors'],
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    recommendedRepRange: '16 - 20 reps',
    instructions: [
      'Sit on floor with knees bent, feet elevated slightly off ground.',
      'Lean back at a 45° angle holding a dumbbell or plate at chest.',
      'Rotate torso from side to side, tapping the weight beside your hip.'
    ],
    formCues: ['Rotate from ribcage, not just moving arms', 'Keep chest open and core braced'],
    commonMistakes: ['Rounding back excessively', 'Rushing rotations without contraction']
  },
  {
    id: 'ex-cable-woodchopper',
    name: 'High-to-Low Cable Woodchopper',
    category: 'Isolation',
    muscleGroup: 'Abs/Core',
    secondaryMuscles: ['Obliques', 'Shoulders'],
    equipment: 'Cable',
    difficulty: 'Intermediate',
    recommendedRepRange: '12 - 15 reps',
    instructions: [
      'Set cable pulley to highest setting and stand sideways with feet wide.',
      'Grip handle with both hands over your outer shoulder.',
      'Rotate torso diagonally downward across your body towards opposite knee.',
      'Control back up to start position.'
    ],
    formCues: ['Pivot on back foot', 'Engage obliques to drive diagonal rotation'],
    commonMistakes: ['Pulling only with arms instead of torso rotation']
  },

  // =========================================================================
  // 11. FULL BODY / OLYMPIC & COMPOUND POWER
  // =========================================================================
  {
    id: 'ex-barbell-clean-press',
    name: 'Barbell Clean & Strict Press',
    category: 'Compound',
    muscleGroup: 'Full Body',
    secondaryMuscles: ['Shoulders', 'Quads', 'Glutes', 'Traps', 'Back', 'Triceps'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '3 - 6 reps',
    instructions: [
      'Start with barbell over mid-foot as in a deadlift.',
      'Explosively pull bar up, shrugging shoulders and dropping underneath to catch bar on anterior deltoids in front rack position.',
      'Reset feet and press barbell directly overhead to full lockout.',
      'Lower bar to chest and then back to floor with control.'
    ],
    formCues: ['Triple extension at hips, knees, and ankles', 'Fast elbows on clean catch', 'Strict overhead press without knee dip'],
    commonMistakes: ['Curling the bar instead of explosive hip drive', 'Pressing with arched lower back']
  },
  {
    id: 'ex-kettlebell-swing',
    name: 'Kettlebell Russian Swing',
    category: 'Compound',
    muscleGroup: 'Full Body',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core', 'Lats', 'Shoulders'],
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    recommendedRepRange: '15 - 20 reps',
    instructions: [
      'Stand with feet shoulder-width, kettlebell on floor 1 foot in front of you.',
      'Hinge hips back and hike kettlebell between legs.',
      'Snap hips forward explosively, driving kettlebell to chest height using hip thrust momentum.',
      'Allow bell to swing naturally back between legs and repeat in fluid rhythm.'
    ],
    formCues: ['It is a hip hinge, NOT a squat', 'Glute snap creates the upward bell flight', 'Keep spine neutral'],
    commonMistakes: ['Squatting and lifting bell with shoulders', 'Overextending lower back at top']
  },
  {
    id: 'ex-barbell-thruster',
    name: 'Barbell Thruster',
    category: 'Compound',
    muscleGroup: 'Full Body',
    secondaryMuscles: ['Quads', 'Glutes', 'Shoulders', 'Triceps', 'Core'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    recommendedRepRange: '8 - 12 reps',
    instructions: [
      'Hold barbell in front rack position on shoulders with elbows up.',
      'Perform a deep front squat until hip crease is below knees.',
      'Drive out of squat forcefully and use upward momentum to launch bar into overhead push press.',
      'Lower bar smoothly back to shoulders while descending into next squat.'
    ],
    formCues: ['Seamless transition from squat drive to overhead press', 'Keep chest high in bottom squat'],
    commonMistakes: ['Pausing between squat and press', 'Collapsing chest forward']
  },
  {
    id: 'ex-farmers-walk',
    name: "Farmer's Walk",
    category: 'Compound',
    muscleGroup: 'Full Body',
    secondaryMuscles: ['Traps', 'Forearms', 'Core', 'Glutes', 'Calves'],
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    recommendedRepRange: '40 - 60 sec',
    instructions: [
      'Deadlift heavy dumbbells or kettlebells to sides.',
      'Walk with short, deliberate, upright steps for designated time or distance.',
      'Maintain tall posture with shoulders back and core braced.'
    ],
    formCues: ['Do not allow weights to pull shoulders down or forward', 'Crush grip on handles', 'Breathe rhythmically'],
    commonMistakes: ['Leaning forward or sideways', 'Taking excessively long strides']
  },

  // =========================================================================
  // 12. CARDIO & CONDITIONING
  // =========================================================================
  {
    id: 'ex-rowing-intervals',
    name: 'Concept2 Rowing Machine Intervals',
    category: 'Cardio',
    muscleGroup: 'Cardio',
    secondaryMuscles: ['Back', 'Legs', 'Core', 'Heart / Lungs'],
    equipment: 'Cardio Machine',
    difficulty: 'Intermediate',
    recommendedRepRange: '500m - 2000m',
    instructions: [
      'Strap feet firmly into footrests and grab handle with overhand grip.',
      'Drive powerfully through legs first, then hinge torso backward slightly, and finish by pulling handle to lower ribs.',
      'Return arms first, hinge torso forward, then bend knees to slide back to catch position.'
    ],
    formCues: ['Sequence: Legs -> Torso -> Arms, then Arms -> Torso -> Legs', 'Keep drive explosive and recovery smooth'],
    commonMistakes: ['Bending knees before arms have cleared during recovery', 'Rounding back at catch']
  },
  {
    id: 'ex-assault-bike',
    name: 'Air / Assault Bike Sprints',
    category: 'Cardio',
    muscleGroup: 'Cardio',
    secondaryMuscles: ['Quads', 'Shoulders', 'Lungs'],
    equipment: 'Cardio Machine',
    difficulty: 'Intermediate',
    recommendedRepRange: '20s on / 40s off',
    instructions: [
      'Adjust seat height so slight knee bend remains at bottom of pedal stroke.',
      'Push and pull handles with arms while pumping legs with maximal power.',
      'Maintain aggressive breathing cadence.'
    ],
    formCues: ['Full push-pull effort on handles', 'Keep knees tracking straight'],
    commonMistakes: ['Flaring knees outward', 'Only using legs without pushing with arms']
  },
  {
    id: 'ex-jump-rope',
    name: 'Speed Jump Rope / Double Unders',
    category: 'Cardio',
    muscleGroup: 'Cardio',
    secondaryMuscles: ['Calves', 'Forearms', 'Shoulders'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    recommendedRepRange: '2 - 3 min rounds',
    instructions: [
      'Hold rope handles at hip level with elbows close to torso.',
      'Rotate rope using quick wrist flicks, jumping lightly on balls of feet just 1-2 inches high.',
      'Maintain steady breathing and relaxed shoulders.'
    ],
    formCues: ['Turn rope with wrists, not whole arms', 'Land softly on balls of feet'],
    commonMistakes: ['Jumping too high with bent knees', 'Flaring arms wide']
  }
];


export const SEED_EXERCISES = CANONICAL_EXERCISES;
