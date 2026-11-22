// Exercise library, equipment and starter workouts.
//
// Exercise fields
//   equip    equipment ids needed (empty = bodyweight)
//   muscles  body areas worked (first = main one)
//   mode     'reps' | 'time'
//   load     'kg' (weight stack / dumbbells) | 'level' (resistance level) | 'none'
//   perSide  reps are counted per side
//   def      default sets / reps [min, max] / secs / rest seconds
//   fig      illustration: scene (equipment) + poses (see figure.js)

export const EQUIPMENT = [
  { id: 'ig1', name: 'IG-1 home gym', note: 'Weight stack, press arms, butterfly pads, leg extension, top & low pulleys' },
  { id: 'rower', name: 'Rowing machine', note: 'Resistance level, time and distance' },
  { id: 'dumbbells', name: 'Dumbbells', note: 'Any pair of dumbbells' },
  { id: 'bench', name: 'Chair or bench', note: 'A sturdy chair, bench or kitchen bench' },
];

export const MUSCLES = ['Legs', 'Glutes', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Mobility'];

// Re-usable scenery
const FLOOR = { k: 'floor' };
const MAT = { k: 'mat' };
const pressSeat = [
  FLOOR,
  { k: 'line', a: [52, 18], b: [52, 141] },
  { k: 'line', a: [52, 18], b: [64, 18] },
  { k: 'rect', x: 60, y: 50, w: 7, h: 62 },
  { k: 'rect', x: 58, y: 112, w: 44, h: 6 },
  { k: 'line', a: [70, 118], b: [70, 141] },
  { k: 'line', a: [96, 118], b: [96, 141] },
];
const tower = (px, py) => [
  FLOOR,
  { k: 'rect', x: 162, y: 4, w: 8, h: 137, c: 'fx-frame-fill' },
  { k: 'line', a: [px, py], b: [166, py] },
  { k: 'pulley', at: [px, py] },
];
const lowTower = [
  FLOOR,
  { k: 'rect', x: 162, y: 4, w: 8, h: 137, c: 'fx-frame-fill' },
  { k: 'line', a: [154, 134], b: [166, 134] },
  { k: 'pulley', at: [154, 134] },
];
const STAND = { hip: [100, 78], t: -90, ankle: [100, 138], ft: 0 };
const rowerScene = [
  FLOOR,
  { k: 'line', a: [16, 132], b: [140, 132] },
  { k: 'line', a: [20, 132], b: [20, 141] },
  { k: 'rect', x: 136, y: 98, w: 28, h: 40, r: 10 },
  { k: 'line', a: [124, 116], b: [130, 136] },
  { k: 'seat', at: 'hip', y: 126, w: 20 },
  { k: 'chain', from: [140, 108], to: 'hand' },
  { k: 'grip', at: 'hand', front: true },
];

const B = 'Breathe out as you push, pull or lift. Breathe in as you lower.';

export const EXERCISES = [
  // ---------- IG-1 ----------
  {
    id: 'leg-extension', name: 'Leg extension', equip: ['ig1'], muscles: ['Legs'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 75 },
    setup: "Line your knee up with the machine's pivot point. Put the pad on your lower shins, just above the ankles, and hold the seat edges.",
    do: 'Straighten your legs until they are nearly straight, squeeze your thighs for a second, then lower slowly.',
    avoid: 'Kicking the weight up or letting the stack slam down.',
    fig: {
      scene: [FLOOR, { k: 'rect', x: 48, y: 44, w: 7, h: 56 }, { k: 'rect', x: 48, y: 100, w: 62, h: 6 },
        { k: 'line', a: [56, 106], b: [56, 141] }, { k: 'line', a: [100, 106], b: [100, 141] },
        { k: 'lever', from: [106, 98], to: 'ankle', front: true }, { k: 'pad', at: 'ankle', front: true }],
      poses: [
        { hip: [72, 94], t: -94, th: 0, sh: 90, ua: 100, fa: 75 },
        { hip: [72, 94], t: -94, th: 0, sh: 8, ua: 100, fa: 75 },
      ],
    },
  },
  {
    id: 'chest-press', name: 'Chest press', equip: ['ig1'], muscles: ['Chest', 'Arms', 'Shoulders'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 75 },
    setup: 'Set the seat so the handles sit level with the middle of your chest. Back flat on the pad, shoulder blades pulled back and down.',
    do: 'Press out until your arms are nearly straight without locking the elbows, then come back slowly until you feel a light stretch.',
    avoid: 'Shrugging your shoulders up to your ears or lifting your back off the pad.',
    fig: {
      scene: [...pressSeat, { k: 'lever', from: [56, 22], to: 'hand', front: true }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { hip: [74, 106], t: -90, th: 0, sh: 90, hand: [84, 64] },
        { hip: [74, 106], t: -90, th: 0, sh: 90, hand: [118, 62] },
      ],
    },
  },
  {
    id: 'pec-fly', name: 'Pec fly', equip: ['ig1'], muscles: ['Chest', 'Shoulders'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 75 },
    setup: 'Sit with your back flat on the pad and forearms against the butterfly pads, elbows at about shoulder height.',
    do: 'Bring the pads together in front of your chest, squeeze for a second, then open slowly until you feel a light stretch.',
    avoid: 'Going past a comfortable stretch or letting your shoulders roll forward.',
    fig: {
      scene: [...pressSeat, { k: 'fpad', front: true }],
      poses: [
        { hip: [74, 106], t: -90, th: 0, sh: 90, ua: 172, fa: -90 },
        { hip: [74, 106], t: -90, th: 0, sh: 90, ua: 4, fa: -90 },
      ],
    },
  },
  {
    id: 'lat-pulldown', name: 'Lat pulldown', equip: ['ig1'], muscles: ['Back', 'Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 75 },
    setup: 'Sit or kneel facing the machine. Grip the bar a bit wider than your shoulders.',
    do: 'Keep your chest up and lean back slightly. Pull the bar to your upper chest by driving your elbows down toward your back pockets, then let it rise slowly.',
    avoid: 'Pulling behind your neck or swinging your body to move the weight.',
    fig: {
      scene: [...tower(116, 8), { k: 'rect', x: 68, y: 112, w: 40, h: 6 }, { k: 'line', a: [88, 118], b: [88, 141] },
        { k: 'rect', x: 106, y: 96, w: 20, h: 6, front: true },
        { k: 'cable', from: [116, 8], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { hip: [88, 106], t: -97, th: 0, sh: 90, ua: -72, fa: -66 },
        { hip: [88, 106], t: -102, th: 0, sh: 90, hand: [98, 64] },
      ],
    },
  },
  {
    id: 'seated-row', name: 'Seated row', equip: ['ig1'], muscles: ['Back', 'Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 75 },
    setup: 'Sit on the floor facing the low pulley. Brace your feet against the frame with knees softly bent and hold the short bar.',
    do: 'Sit tall and pull the bar to your belly button, squeezing your shoulder blades together. Let your arms go forward slowly without rounding your back.',
    avoid: 'Rocking back and forth. Your torso stays still, which protects your back.',
    fig: {
      scene: [FLOOR, MAT, { k: 'rect', x: 146, y: 30, w: 8, h: 111, c: 'fx-frame-fill' }, { k: 'pulley', at: [142, 128] },
        { k: 'line', a: [138, 118], b: [142, 140] },
        { k: 'cable', from: [142, 128], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { hip: [66, 133], t: -90, ankle: [124, 128], ft: -75, ua: 6, fa: 4 },
        { hip: [66, 133], t: -90, ankle: [124, 128], ft: -75, hand: [84, 106] },
      ],
    },
  },
  {
    id: 'cable-curl', name: 'Bicep curl (low pulley)', equip: ['ig1'], muscles: ['Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 60 },
    setup: 'Stand facing the low pulley, holding the short bar with palms up.',
    do: 'Keep your elbows pinned to your sides. Curl the bar up to your chest, then lower it over 3 seconds.',
    avoid: 'Leaning back or swinging to get the weight up.',
    fig: {
      scene: [...lowTower, { k: 'cable', from: [154, 134], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { ...STAND, ua: 93, fa: 78 },
        { ...STAND, ua: 93, fa: -72 },
      ],
    },
  },
  {
    id: 'tricep-pushdown', name: 'Tricep pushdown', equip: ['ig1'], muscles: ['Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 60 },
    setup: 'Stand facing the top pulley, holding the bar with hands about shoulder-width apart.',
    do: 'Keep your elbows pinned to your sides. Push the bar down until your arms are straight, then let it rise until your elbows reach about 90 degrees.',
    avoid: 'Letting your elbows drift forward or using your body weight to push down.',
    fig: {
      scene: [...tower(128, 8), { k: 'cable', from: [128, 8], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { ...STAND, hip: [98, 78], ankle: [98, 138], t: -84, ua: 96, fa: -8 },
        { ...STAND, hip: [98, 78], ankle: [98, 138], t: -84, ua: 96, fa: 82 },
      ],
    },
  },
  {
    id: 'straight-arm-pulldown', name: 'Straight-arm pulldown', equip: ['ig1'], muscles: ['Back', 'Core'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 60 },
    setup: 'Stand a step back from the top pulley, holding the bar with straight arms and a soft bend in the elbows. Hinge forward slightly.',
    do: 'Keeping your arms long, sweep the bar down in an arc to the front of your thighs. Squeeze your back, then let it rise slowly to eye level.',
    avoid: 'Bending your elbows to turn it into a pushdown, or arching your lower back.',
    fig: {
      scene: [...tower(132, 8), { k: 'cable', from: [132, 8], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { hip: [92, 80], t: -78, ankle: [98, 138], ft: 0, ua: -28, fa: -22 },
        { hip: [92, 80], t: -78, ankle: [98, 138], ft: 0, ua: 72, fa: 66 },
      ],
    },
  },
  {
    id: 'upright-row', name: 'Upright row (low pulley)', equip: ['ig1'], muscles: ['Shoulders', 'Back'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [12, 12], rest: 60 },
    setup: 'Stand facing the low pulley holding the short bar with an overhand grip, hands shoulder-width apart.',
    do: 'Lead with your elbows and lift the bar up the front of your body to lower-chest height, then lower it slowly.',
    avoid: 'Lifting higher than your chest or shrugging hard. Stop if your shoulders pinch.',
    fig: {
      scene: [...lowTower, { k: 'cable', from: [154, 134], to: 'hand' }, { k: 'grip', at: 'hand', front: true }],
      poses: [
        { ...STAND, ua: 88, fa: 84 },
        { ...STAND, ua: -150, fa: 30 },
      ],
    },
  },

  // ---------- Rowing machine ----------
  {
    id: 'row-steady', name: 'Steady row', equip: ['rower'], muscles: ['Cardio', 'Back', 'Legs'],
    mode: 'time', load: 'level', def: { sets: 1, secs: 600, rest: 90 },
    setup: 'Strap your feet in so the strap sits across the widest part of your foot. Sit tall and hold the handle with relaxed arms.',
    do: 'Drive with your legs first, then lean back slightly, then pull the handle to your lower ribs. Return in reverse: arms, body, then bend the knees. Keep an easy, steady pace you could chat at.',
    avoid: 'Pulling with your arms before your legs have pushed, or hunching your back at the front.',
    tip: 'The recovery (sliding forward) should take about twice as long as the drive.',
    fig: {
      scene: rowerScene, tempo: [0.8, 1.6], hold: 0.15,
      poses: [
        { hip: [78, 122], t: -66, ankle: [124, 122], ft: -70, hand: [128, 106], eb: -1 },
        { hip: [62, 122], t: -106, ankle: [124, 122], ft: -70, hand: [74, 98] },
      ],
    },
  },
  {
    id: 'row-intervals', name: 'Row intervals', equip: ['rower'], muscles: ['Cardio', 'Back', 'Legs'],
    mode: 'time', load: 'level', def: { sets: 6, secs: 60, rest: 60 },
    setup: 'Same set-up as a steady row. Warm up with a few minutes of easy rowing first.',
    do: 'Row hard for the interval with strong leg drives, then rest. Aim for a pace you can repeat on every interval.',
    avoid: 'Sprinting the first one and fading. Consistent beats heroic.',
    fig: {
      scene: rowerScene, tempo: [0.6, 1.1], hold: 0.1,
      poses: [
        { hip: [78, 122], t: -66, ankle: [124, 122], ft: -70, hand: [128, 106], eb: -1 },
        { hip: [62, 122], t: -106, ankle: [124, 122], ft: -70, hand: [74, 98] },
      ],
    },
  },

  // ---------- Dumbbells ----------
  {
    id: 'goblet-squat', name: 'Goblet squat', equip: ['dumbbells'], muscles: ['Legs', 'Glutes'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 75 },
    setup: 'Hold one dumbbell upright against your chest with both hands. Feet shoulder-width apart, toes turned out slightly.',
    do: 'Push your hips back and bend your knees to sit down between your heels, chest up. Drive through your whole foot to stand.',
    avoid: 'Knees caving in or heels lifting off the floor.',
    fig: {
      scene: [FLOOR, { k: 'db', at: 'hand', front: true }],
      poses: [
        { ...STAND, hand: [112, 46] },
        { hip: [80, 104], t: -62, ankle: [100, 138], ft: 0, hand: [116, 78] },
      ],
    },
  },
  {
    id: 'rdl', name: 'Romanian deadlift', equip: ['dumbbells'], muscles: ['Glutes', 'Legs', 'Back'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 75 },
    setup: 'Stand tall with a dumbbell in each hand in front of your thighs, knees soft.',
    do: 'Push your hips back and slide the dumbbells down your legs with a flat back until you feel a stretch in your hamstrings. Squeeze your glutes to stand back up.',
    avoid: 'Rounding your back or turning it into a squat. The hips go back, not down.',
    fig: {
      scene: [FLOOR, { k: 'db', at: 'hand', front: true }],
      poses: [
        { ...STAND, ua: 92, fa: 90 },
        { hip: [76, 86], t: -32, ankle: [100, 138], ft: 0, ua: 90, fa: 90 },
      ],
    },
  },
  {
    id: 'db-row', name: 'One-arm dumbbell row', equip: ['dumbbells', 'bench'], muscles: ['Back', 'Arms'],
    mode: 'reps', load: 'kg', perSide: true, def: { sets: 2, reps: [10, 12], rest: 60 },
    setup: 'Put one knee and the same-side hand on a bench, back flat. Hold a dumbbell in the other hand, arm hanging straight.',
    do: 'Pull the dumbbell up toward your hip, leading with your elbow, then lower it slowly. Finish all reps, then switch sides.',
    avoid: 'Twisting your body open or yanking the weight.',
    fig: {
      scene: [FLOOR, { k: 'rect', x: 30, y: 112, w: 100, h: 6 }, { k: 'line', a: [40, 118], b: [40, 141] },
        { k: 'line', a: [120, 118], b: [120, 141] }, { k: 'db', at: 'hand', front: true }],
      poses: [
        { hip: [70, 80], t: -6, th2: 90, sh2: 180, ft2: 180, ankle: [88, 139], ft: 0, hand2: [116, 111], eb2: -1, ua: 90, fa: 90 },
        { hip: [70, 80], t: -6, th2: 90, sh2: 180, ft2: 180, ankle: [88, 139], ft: 0, hand2: [116, 111], eb2: -1, hand: [100, 86] },
      ],
    },
  },
  {
    id: 'db-press', name: 'Dumbbell shoulder press', equip: ['dumbbells'], muscles: ['Shoulders', 'Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 60 },
    setup: 'Sit tall on a chair (or stand) holding a dumbbell in each hand at shoulder height, palms facing forward.',
    do: 'Press the dumbbells up until your arms are nearly straight overhead, then lower them slowly back to your shoulders.',
    avoid: 'Leaning back to push the weight up. Keep a light brace in your stomach.',
    fig: {
      scene: [{ k: 'chair', x: 70, y: 110 }, FLOOR, { k: 'db', at: 'hand', front: true }],
      poses: [
        { hip: [90, 104], t: -90, th: 0, sh: 90, ft: 0, ua: 80, fa: -96 },
        { hip: [90, 104], t: -90, th: 0, sh: 90, ft: 0, ua: -88, fa: -90 },
      ],
    },
  },
  {
    id: 'db-curl', name: 'Dumbbell curl', equip: ['dumbbells'], muscles: ['Arms'],
    mode: 'reps', load: 'kg', def: { sets: 2, reps: [10, 12], rest: 60 },
    setup: 'Stand tall with a dumbbell in each hand, palms facing forward, arms by your sides.',
    do: 'Keep your elbows by your sides and curl the dumbbells to your shoulders, then lower them over 3 seconds.',
    avoid: 'Swinging your body or letting your elbows drift forward.',
    fig: {
      scene: [FLOOR, { k: 'db', at: 'hand', front: true }],
      poses: [
        { ...STAND, ua: 93, fa: 86 },
        { ...STAND, ua: 93, fa: -72 },
      ],
    },
  },

  // ---------- Chair / bench ----------
  {
    id: 'chair-squat', name: 'Chair squat', equip: ['bench'], muscles: ['Legs', 'Glutes'],
    mode: 'reps', load: 'none', def: { sets: 2, reps: [10, 12], rest: 60 },
    setup: 'Stand in front of a sturdy chair with feet shoulder-width apart and toes turned out slightly.',
    do: 'Push your hips back and lower until your backside lightly touches the chair. Stand back up, driving through your whole foot.',
    avoid: 'Knees caving inward (they should follow your toes) or flopping onto the chair.',
    fig: {
      scene: [{ k: 'chair', x: 48, y: 108 }, FLOOR],
      poses: [
        { ...STAND, ua: 2, fa: 0 },
        { hip: [76, 103], t: -56, ankle: [100, 138], ft: 0, ua: -4, fa: -4 },
      ],
    },
  },
  {
    id: 'incline-push-up', name: 'Incline push-up', equip: ['bench'], muscles: ['Chest', 'Arms', 'Core'],
    mode: 'reps', load: 'none', def: { sets: 2, reps: [8, 12], rest: 60 },
    target: 'Stop 2 reps short of failure',
    setup: 'Put your hands on the edge of a sturdy bench or kitchen bench, a bit wider than shoulder-width. Walk your feet back until your body is straight.',
    do: 'Lower your chest to the edge with elbows angled about 45 degrees from your body, then push back up.',
    avoid: 'Letting your hips sag or poke up.',
    tip: 'A lower surface makes it harder. Work down over the weeks toward the floor.',
    fig: {
      scene: [FLOOR, { k: 'rect', x: 140, y: 104, w: 44, h: 6 }, { k: 'line', a: [146, 110], b: [146, 141] }, { k: 'line', a: [178, 110], b: [178, 141] }],
      poses: [
        { hip: [86, 99], t: -40, ankle: [40, 137], ft: 110, hand: [150, 103] },
        { hip: [90, 104], t: -32, ankle: [40, 137], ft: 110, hand: [150, 103] },
      ],
    },
  },

  // ---------- Bodyweight ----------
  {
    id: 'glute-bridge', name: 'Glute bridge', equip: [], muscles: ['Glutes', 'Core'],
    mode: 'reps', load: 'none', def: { sets: 2, reps: [12, 12], rest: 45 },
    setup: 'Lie on your back with knees bent and feet flat, hip-width apart, heels close to your backside.',
    do: 'Push through your heels and lift your hips until your body is straight from knees to shoulders. Squeeze your glutes at the top for 2 seconds.',
    avoid: 'Arching your lower back to get higher. The lift comes from your glutes, not your back.',
    fig: {
      scene: [FLOOR, MAT],
      poses: [
        { hip: [96, 133], t: 180, ankle: [132, 137], ft: 0, ua: 0, fa: 0 },
        { hip: [92, 114], t: 155, hd: 25, ankle: [132, 137], ft: 0, ua: 2, fa: 0 },
      ],
    },
  },
  {
    id: 'reverse-lunge', name: 'Reverse lunge', equip: [], muscles: ['Legs', 'Glutes'],
    mode: 'reps', load: 'none', perSide: true, def: { sets: 2, reps: [8, 8], rest: 60 },
    setup: 'Stand tall with a hand on the wall for balance if needed.',
    do: 'Step one foot back and lower until the back knee hovers just off the floor. Push through the front heel to come back up.',
    avoid: 'Letting the front knee collapse inward.',
    tip: 'If balance is shaky, keep your feet in place and just go up and down (a split squat).',
    fig: {
      scene: [FLOOR],
      poses: [
        { ...STAND, ankle2: [100, 138], ft2: 0, ua: 95, fa: 90 },
        { hip: [78, 106], t: -88, ankle: [102, 138], ft: 0, ankle2: [36, 132], ft2: 40, ua: 95, fa: 90 },
      ],
    },
  },
  {
    id: 'bird-dog', name: 'Bird dog', equip: [], muscles: ['Core', 'Back', 'Glutes'],
    mode: 'reps', load: 'none', perSide: true, def: { sets: 2, reps: [6, 6], rest: 45 },
    setup: 'Get on hands and knees, hands under shoulders and knees under hips.',
    do: 'Slowly reach one arm forward and the opposite leg back, and hold for 3 seconds. Return and switch sides.',
    avoid: "Tipping your hips or arching your back. Pretend there's a cup of tea on your lower back.",
    fig: {
      scene: [FLOOR, MAT], tempo: [1.2, 1.2], hold: 1.2,
      poses: [
        { hip: [70, 108], t: -18, hd: 12, th: 90, sh: 180, ft: 175, th2: 90, sh2: 180, ft2: 175, ua: 90, fa: 90, ua2: 90, fa2: 90 },
        { hip: [70, 108], t: -18, hd: 12, th: 90, sh: 180, ft: 175, th2: 176, sh2: 178, ft2: 95, ua: -16, fa: -16, ua2: 90, fa2: 90 },
      ],
    },
  },
  {
    id: 'plank', name: 'Plank', equip: [], muscles: ['Core'],
    mode: 'time', load: 'none', def: { sets: 2, secs: 25, rest: 45 },
    setup: 'Rest on your forearms. Start from your knees, and move to your toes once 30 seconds feels easy.',
    do: 'Keep a straight line from head to knees (or heels), with glutes squeezed. Breathe steadily the whole time.',
    avoid: 'Letting your hips sag or pushing your backside up in the air.',
    tip: 'Progress by adding 5 seconds at a time.',
    fig: {
      scene: [FLOOR, MAT],
      poses: [{ hip: [95, 124], t: -12.5, th: 167.5, sh: 167.5, ft: 95, ua: 90, fa: 0 }],
    },
  },
  {
    id: 'dead-bug', name: 'Dead bug', equip: [], muscles: ['Core'],
    mode: 'reps', load: 'none', perSide: true, def: { sets: 2, reps: [8, 8], rest: 45 },
    setup: 'Lie on your back with arms pointing at the ceiling and knees bent at 90 degrees above your hips.',
    do: 'Gently press your lower back into the floor. Slowly lower one arm and the opposite leg toward the floor, breathing out as you go, then return and switch.',
    avoid: 'Letting your lower back lift off the floor. Only go as low as you can while keeping it flat.',
    fig: {
      scene: [FLOOR, MAT], tempo: [1.6, 1.4], hold: 0.6,
      poses: [
        { hip: [102, 131], t: 180, th: -90, sh: 0, ft: -80, th2: -90, sh2: 0, ft2: -80, ua: -90, fa: -90, ua2: -90, fa2: -90 },
        { hip: [102, 131], t: 180, th: -90, sh: 0, ft: -80, th2: -12, sh2: -6, ft2: -75, ua: -165, fa: -168, ua2: -90, fa2: -90 },
      ],
    },
  },
  {
    id: 'wall-sit', name: 'Wall sit', equip: [], muscles: ['Legs'],
    mode: 'time', load: 'none', def: { sets: 2, secs: 30, rest: 60 },
    setup: 'Stand with your back flat against a wall, feet about two foot-lengths out in front of you.',
    do: 'Slide down until your knees are bent (aim for 90 degrees, higher is fine) and hold, breathing steadily.',
    avoid: 'Letting your knees drift past your toes or holding your breath.',
    fig: {
      scene: [{ k: 'wall', x: 58 }, FLOOR],
      poses: [{ hip: [68, 108], t: -90, th: 0, sh: 90, ft: 0, hand: [88, 106] }],
    },
  },
  {
    id: 'calf-raise', name: 'Calf raise', equip: [], muscles: ['Legs'],
    mode: 'reps', load: 'none', def: { sets: 2, reps: [15, 15], rest: 45 },
    setup: 'Stand tall with feet hip-width apart, a hand on a wall or chair for balance.',
    do: 'Rise up onto the balls of your feet as high as you can, pause for a second, then lower slowly.',
    avoid: 'Bouncing or rolling onto the outside of your feet.',
    fig: {
      scene: [FLOOR],
      poses: [
        { hip: [100, 78], t: -90, th: 90, sh: 90, ft: 0, ua: 95, fa: 90 },
        { hip: [100, 71], t: -90, th: 90, sh: 90, ft: 52, ua: 95, fa: 90 },
      ],
    },
  },

  // ---------- Warm-up & mobility ----------
  {
    id: 'march', name: 'March on the spot', equip: [], muscles: ['Mobility', 'Cardio'],
    mode: 'time', load: 'none', def: { sets: 1, secs: 150, rest: 15 },
    setup: 'Stand tall. You can also walk the hallway instead.',
    do: 'March, lifting your knees to a comfortable height and swinging your arms. Gradually build to a brisk pace.',
    avoid: 'Rushing. This is just to get warm.',
    fig: {
      scene: [FLOOR], tempo: [0.55, 0.55], hold: 0.08,
      poses: [
        { hip: [100, 78], t: -90, th: -2, sh: 88, ft: 0, th2: 90, sh2: 90, ft2: 0, ua: 115, fa: 100, ua2: 60, fa2: 15 },
        { hip: [100, 78], t: -90, th: 90, sh: 90, ft: 0, th2: -2, sh2: 88, ft2: 0, ua: 60, fa: 15, ua2: 115, fa2: 100 },
      ],
    },
  },
  {
    id: 'arm-circles', name: 'Arm circles', equip: [], muscles: ['Mobility', 'Shoulders'],
    mode: 'reps', load: 'none', def: { sets: 1, reps: [10, 10], rest: 15 },
    target: '10 each way',
    setup: 'Stand tall with your arms relaxed by your sides.',
    do: 'Make big slow circles with straight arms, 10 forwards then 10 backwards.',
    avoid: 'Shrugging your shoulders up.',
    fig: {
      scene: [FLOOR], seg: 0.45, hold: 0,
      poses: [
        { ...STAND, ua: 90, fa: 90 }, { ...STAND, ua: 0, fa: 0 },
        { ...STAND, ua: -90, fa: -90 }, { ...STAND, ua: 180, fa: 180 },
      ],
    },
  },
  {
    id: 'cat-cow', name: 'Cat-cow', equip: [], muscles: ['Mobility', 'Back'],
    mode: 'reps', load: 'none', def: { sets: 1, reps: [5, 5], rest: 15 },
    setup: 'Get on hands and knees, hands under shoulders and knees under hips.',
    do: 'Slowly round your back up toward the ceiling, tucking your chin (cat). Then gently let your belly drop and lift your gaze (cow). Move with your breath.',
    avoid: 'Forcing the range. Keep it gentle and smooth.',
    fig: {
      scene: [FLOOR, MAT], tempo: [1.6, 1.6], hold: 0.6,
      poses: [
        { hip: [70, 108], t: -18, hd: 40, curve: 10, th: 90, sh: 180, ft: 175, ua: 90, fa: 90 },
        { hip: [70, 108], t: -18, hd: -28, curve: -6, th: 90, sh: 180, ft: 175, ua: 90, fa: 90 },
      ],
    },
  },
];

const W = (exId, over = {}) => ({ exId, ...over });

// Starter workouts. The first two follow the Home Gym Plan (IG-1).
export const TEMPLATES = [
  {
    id: 'plan-a', name: 'Workout A', group: 'Home Gym Plan', rotation: 'plan',
    desc: 'Full body: legs, glutes, chest, back and core. About 35–45 min.',
    items: [
      W('leg-extension'), W('glute-bridge'), W('chest-press'), W('lat-pulldown'),
      W('seated-row'), W('bird-dog'), W('plank'),
    ],
  },
  {
    id: 'plan-b', name: 'Workout B', group: 'Home Gym Plan', rotation: 'plan',
    desc: 'Full body: squats, lunges, chest, arms and core. About 35–45 min.',
    items: [
      W('chair-squat'), W('reverse-lunge'), W('pec-fly'), W('cable-curl'),
      W('tricep-pushdown'), W('incline-push-up'), W('dead-bug'),
    ],
  },
  {
    id: 'row-core', name: 'Row + core', group: 'Extras',
    desc: 'Easy cardio on the rower, then core work that is kind to your back.',
    items: [W('row-steady'), W('glute-bridge'), W('dead-bug'), W('bird-dog'), W('plank')],
  },
  {
    id: 'ig1-upper', name: 'IG-1 upper body', group: 'Extras',
    desc: 'Every pulley and press arm on the IG-1, with no floor work.',
    items: [W('chest-press'), W('lat-pulldown'), W('pec-fly'), W('seated-row'), W('upright-row'), W('cable-curl'), W('tricep-pushdown')],
  },
  {
    id: 'db-full', name: 'Dumbbell full body', group: 'Extras',
    desc: 'For days away from the IG-1. Just a pair of dumbbells and a bench.',
    items: [W('goblet-squat'), W('rdl'), W('db-row'), W('db-press'), W('db-curl'), W('dead-bug')],
  },
];

export const WARMUP = [
  'Walk or march the hallway for 2–3 minutes.',
  'Do 10 arm circles each way.',
  'Do 5 slow cat-cows on hands and knees.',
  'Do 10 squats down to a chair.',
  'Do one light set of your first machine exercise at about half the weight.',
];

export const BREATHING = B;
