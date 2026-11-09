// Reid's coaching plan — hardcoded on purpose (see features/redesign/spec.md, decision 8).
// Shown on Today (home routine) and Library → Guides.

export const FOCUS_AREAS = [
  { rank: 1, area: 'Left shoulder turn on backswing', note: 'Flagged every session Feb–Nov — still needs a bit more' },
  { rank: 2, area: 'Grip', note: 'Finger placement, pressure, both hands staying on' },
  { rank: 3, area: 'Takeaway path', note: 'Across chest, thumbs up, not laid off' },
  { rank: 4, area: 'Arms + body connection', note: 'Moving as one unit, not independently' },
  { rank: 5, area: 'Release through impact', note: "Don't hang on" },
  { rank: 6, area: 'Pelvis drives the downswing', note: 'Improving — "nice bounce" noted in July' },
  { rank: 7, area: 'Driver ball position', note: 'Inside left heel — corrected November' },
  { rank: 8, area: 'Club face control', note: 'Square through the ball, most recent focus' },
]

export const HOME_ITEMS = [
  { id: 'grip', label: 'Grip routine', duration: '2 min', detail: 'Set left hand (2 knuckles, V to right shoulder), right hand from the side relaxed. Waggle, hinge, figure eights — pressure 3–4/10 throughout. Reset 3×.' },
  { id: 'belly', label: 'Belly drill', duration: '3 min', detail: 'Stick butt of club in belly. Grip left arm down shaft until straight. Turn left shoulder to right big toe without head moving. Arms, club, and belly at the same rate. 8–10 slow reps.' },
  { id: 'shadow', label: 'Shadow swings + towel', duration: '5 min', detail: 'Tuck golf towel under both arms. 10 slow connected swings — arms staying against body throughout. Feels like a straight jacket. That\'s correct.' },
]

export const RANGE_PHASES = [
  {
    label: 'Phase 1 — Warmup',
    balls: '~20 balls · short irons',
    items: [
      'Feet together drill — 40–50% speed, thumbs up checkpoint, rotation not sway',
      '9-to-3 with 1-2-3 tempo — left shoulder to right foot, hands in front, connected half swings',
    ],
  },
  {
    label: 'Phase 2 — Partial swings',
    balls: '~20 balls · short-to-mid irons',
    items: [
      '10-to-2 — one-piece takeaway, left shoulder turn',
      'Thumbs up checkpoint on the way back',
      'Release through impact — ball going right = hanging on',
    ],
  },
  {
    label: 'Phase 3 — Full swings',
    balls: '~20 balls · mid irons + driver',
    items: [
      'Integrate: grip → takeaway across chest → left shoulder → pelvis drives',
      'Fire around, not out to first base — finish tall on left foot',
      'Driver: ball inside left heel, not too long, hold on',
    ],
  },
]

export const PREROUND_STEPS = [
  'Grip check',
  '5× feet together swings',
  '5× 9-to-3',
  '5× full swings at 70%',
  'Driver: confirm ball inside left heel before first tee shot',
]

export const REFERENCE_DRILLS = [
  {
    id: 'belly',
    name: 'Belly Drill',
    trains: 'Left shoulder turn, connected one-piece takeaway',
    homeOnly: false,
    steps: [
      'Stick butt of club into your belly.',
      'Grip the club with your left hand — slide your hand down the shaft until your arm is straight (uncomfortably so).',
      'Turn your left shoulder to your right big toe without your head moving too much.',
      'Move your arm, the club, and your belly at the same rate — not the arms leading.',
      '5–10 slow reps.',
    ],
    checkpoint: 'Head stays still throughout. If it moves, slow down.',
  },
  {
    id: '9-3',
    name: '9-to-3 / 10-to-2 / 11-to-1',
    trains: 'Connected partial swings, left shoulder turn, release',
    homeOnly: false,
    steps: [
      '9-to-3: Club to hip height on backswing, hip height on follow-through. Turn back = left shoulder to inside of right foot. Full torso turn — hands stay in front of your body.',
      '10-to-2: Same principles, slightly longer. One-piece takeaway. Just a little wrist hinge.',
      '11-to-1 (shoulder to shoulder): "You\'re making a big L at the top and a big L on the way down."',
    ],
    checkpoint: 'Use 1-2-3 tempo throughout. Count out loud if needed.',
  },
  {
    id: 'feet',
    name: 'Feet Together',
    trains: 'Rotation vs. lateral sway, balance, grip checkpoint',
    homeOnly: false,
    steps: [
      'Check your grip before starting.',
      'Stand with feet together (touching or very close).',
      'Swing at 40–50% speed only — not about distance.',
      'Thumbs up to the sky = correct hinge. Flat thumbs = wrong.',
      'Weight: right heel on backswing, left heel on follow-through — like turning around.',
    ],
    checkpoint: 'If you sway, you\'ll fall. The drill self-corrects.',
  },
  {
    id: 'towel',
    name: 'Towel Under Arms',
    trains: 'Arms and body moving as one unit — connection',
    homeOnly: false,
    steps: [
      'Tuck a golf towel under both arms, pressed against your chest.',
      'Swing. Max 70–80 yards — not a distance drill.',
      'If the towel falls, your arms separated. Start smaller.',
      'Start with chip-length swings, work up to half swings.',
      'Let the club swing — don\'t force it.',
    ],
    checkpoint: 'Feels like a straight jacket. That\'s correct.',
  },
  {
    id: 'wall',
    name: 'Wall Drill',
    trains: 'Takeaway path — prevents club getting too flat/laid off',
    homeOnly: true,
    steps: [
      'Place your right foot against a wall.',
      'Step left foot in front and take your normal stance — about one foot from the wall.',
      'At hip height on the backswing, the club should be parallel to the wall.',
      'Swing without hitting the wall. Club falls down, swings through, goes back up.',
      'If you hit the wall, takeaway got too flat — thumbs aren\'t going up enough.',
    ],
    checkpoint: 'The feel: more upright — hands and thumbs working up, not around.',
  },
  {
    id: '123',
    name: '1-2-3 Tempo',
    trains: 'Smooth tempo, prevents rushing the transition',
    homeOnly: false,
    steps: [
      'On your takeaway, say (or think): "one."',
      'At the top of your backswing, say: "two." Creates a deliberate pause.',
      'Through the downswing to finish, say: "three."',
    ],
    checkpoint: 'Count out loud if you need to. Pair with the towel drill if arms and body can\'t stay together.',
  },
  {
    id: 'pelvis',
    name: 'Pelvis Push',
    trains: 'Downswing sequencing — lower body initiates',
    homeOnly: false,
    steps: [
      'Go to the top of your backswing (simulate without a club if at home).',
      'Sequence: shift down → push pelvis up and through to the target.',
      'Left hip goes up and around. Right hip goes through to the target.',
      'Don\'t manually rotate the hips — the push creates the rotation.',
      'Finish tall on your left foot. Butt cheeks clenched.',
    ],
    checkpoint: 'Do it earlier, not harder. If right foot twists, you\'re over-rotating.',
  },
]
