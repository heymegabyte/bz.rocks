#!/usr/bin/env node
// scripts/films/the-last-soldier-refused/build-manifest.mjs
// ---------------------------------------------------------------------------
// Generate the CINEMA MIND ProductionManifest for "The Last Soldier Refused"
// REDO (2026-10-25): NO REPEAT FOOTAGE — 50 UNIQUE beats spanning the full 4:52,
// each clip used ONCE (concat, not beat-cut pool-cycling). Epic women-led,
// cosmic-framed storyline ("The Women Who Stopped the War"): AMARA the
// multicultural mercy-bearer + a global chorus of beautiful multicultural women
// who walk onto the battlefields and end the war, framed by the same stars.
// Compact beat-list → full schema via a template, so the creative content stays
// readable while the ~3000-line manifest is machine-filled + validator-clean.
// ---------------------------------------------------------------------------
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'manifest.json');

const NEG =
  'blood, gore, CGI, 3D render, video game, plastic skin, cartoon, anime, floating people, levitating, superimposed text, HUD, watermark, flags, insignia, glowing eyes, exploitation';

// Grade → lighting + prompt phrasing.
const GRADES = {
  cosmic: {
    light: 'real astrophotography starlight, deep space blues and golds, the Milky Way, natural',
    kf: 'a vast photoreal starfield and cosmos, deep space blues and golds, the Milky Way',
    vp: 'photoreal cosmic/astrophotography grade, deep space blues and golds'
  },
  cold: {
    light: 'cold desaturated blue-grey war dawn, overcast, thin smoke diffusing the light',
    kf: 'cold desaturated blue-grey war grade',
    vp: 'cold desaturated blue-grey grade'
  },
  warm: {
    light: 'warm golden-hour light, soft and tender',
    kf: 'warm golden-hour grade',
    vp: 'warm golden-hour grade'
  },
  warming: {
    light: 'cold dawn warming to gold, light opening',
    kf: 'cold grade warming to gold',
    vp: 'cold grade warming to gold'
  }
};

const MOVE = {
  drone: 'a slow cinematic aerial drift',
  'push-in': 'a slow cinematic push-in',
  pullback: 'a slow cinematic pull-back',
  tracking: 'a grounded tracking move',
  crane: 'a rising crane move',
  orbit: 'a slow orbit',
  'locked-off': 'a still locked-off frame',
  tilt: 'a slow tilt',
  pan: 'a slow pan',
  dolly: 'a slow dolly'
};

// ── The 50 unique beats (the creative spine), grouped into 10 acts ──────────
// f=framing, m=movement, g=grade, refs=referenceAssets, note=lyric anchor
const B = [
  // ACT 1 — THE SAME STARS (cosmic prologue)
  ['s0','establishing','drone','cosmic','A vast starfield over a dark sleeping earth','Deep space turning slowly above the curve of a dark earth, the Milky Way blazing','the cosmos drifts slowly above the dark earth',['the-cosmos'],'intro — the same stars over the whole world'],
  ['s0','wide','crane','cosmic','Amara on a high ridge beneath the whole night sky','A lone ridge under an enormous starfield at the edge of dawn, a beautiful multicultural woman standing small against the cosmos','the camera cranes up behind her toward the stars',['amara','the-ridge'],'one witness beneath the same sky'],
  ['s0','close-up','push-in','cosmic','The stars reflected in Amara’s eyes','A beautiful multicultural woman’s face tilted up, starlight and galaxies mirrored in her wet eyes','a slow push-in as the stars wheel in her eyes',['amara'],'the whole sky held in one gaze'],
  ['s0','wide','pan','cosmic','The same stars over a war-torn horizon','The starfield low over a distant ruined horizon, the first grey of dawn bleeding in at the edge','a slow pan from the stars down toward the ruined horizon',['the-cosmos','the-ridge'],'the same stars over every field'],
  ['s0','establishing','tilt','cold','First light erases the stars over a grey world','The last stars fading as a cold grey war-dawn rises over a cratered land','a slow tilt down as the stars vanish into the grey dawn',['the-ridge'],'dawn, and the war begins beneath it'],
  // ACT 2 — THE WOMEN OF THE WORLD
  ['s1','medium','push-in','warm','A Black mother praying in a village doorway at dawn','A beautiful Black mother in a warm-lit village doorway, hands folded in prayer, dawn behind her','a slow push-in on her folded hands and lifted face',['chorus','the-village'],'same mama praying, face to the floor'],
  ['s1','medium','push-in','warm','A Latina wife at a city window, hand on the glass','A beautiful Latina woman at a high window of a waking city, her hand pressed to the cold glass, breath fogging it','a slow push-in on her hand and reflected face',['chorus','the-city'],'same father waiting beside the door'],
  ['s1','wide','crane','warm','An East-Asian sister on a rooftop watching the horizon','A beautiful East-Asian young woman on a rooftop at dawn, wind in her hair, scanning a distant horizon','a crane rising beside her toward the horizon',['chorus','the-city'],'same baby sister: come home from the war'],
  ['s1','medium','tracking','warm','A Middle-Eastern daughter by the sea, scarf in the wind','A beautiful Middle-Eastern young woman at the shoreline at dawn, a bright scarf streaming in the sea wind','a tracking move along the shore with her',['chorus','the-shore'],'same dreams that deserve to be more'],
  ['s1','close-up','push-in','warm','A South-Asian woman lighting a candle for the ones at war','A beautiful South-Asian woman cupping a candle flame against the dark, her face warm in its glow','a slow push-in on the candle and her eyes',['chorus','the-village'],'women everywhere, the same heart'],
  // ACT 3 — THE MACHINE / THE ORDER
  ['s2','wide','dolly','cold','The commander over lit war-maps in a cold bunker','An older commander leaning over a long table of lit war-maps in a cold concrete bunker, officers in shadow','a slow dolly across the map table',['commander','the-bunker'],'commands crack through a crooked connection'],
  ['s2','insert','tracking','cold','The order crackles out down the wire','A gloved hand keying a field radio, a telephone wire running out toward a grey front','a tracking move out along the wire into the grey',['the-bunker'],'march towards the smoke in the enemy’s direction'],
  ['s2','establishing','drone','cold','Soldiers massing in a ruined trench at dawn','A long muddy front-line trench packed with weary young soldiers, barbed wire, thin smoke, cold dawn','a slow aerial drift along the trench line',['the-trench'],'young boys forced to choose'],
  ['s2','insert','push-in','cold','A soldier’s hands loading a rifle, cold and mechanical','Close on grimed young hands pressing rounds into a rifle in the cold trench, breath steaming','a slow push-in on the loading hands',['the-trench','the-rifle'],'boots in the mud, blood on the boots'],
  ['s2','reaction','push-in','warm','Far away, a mother’s head bows as if she felt it','A beautiful multicultural mother in warm light bowing her head sharply, a hand to her chest, as if struck','a slow push-in as her head bows',['chorus','the-village'],'the women feel the order land'],
  // ACT 4 — AMARA ON THE FIELD (the mercy-bearer)
  ['s3','wide','tracking','cold','Amara crosses a smoking battlefield in medic garb','Amara, a beautiful multicultural woman in worn medic garb and a red-cross armband, walking grounded across a smoking cratered field','a grounded tracking move with her through the smoke',['amara','the-battlefield'],'across that field, through the ash and aggression'],
  ['s3','medium','push-in','cold','Amara kneels to tend a wounded soldier of one side','Amara kneeling in the mud to bind the wound of a fallen young soldier, tender and urgent, no gore','a slow push-in on her hands and his face',['amara','the-battlefield'],'mercy reaching the first of the fallen'],
  ['s3','medium','tracking','cold','Amara crosses the line to tend a wounded ENEMY soldier','Amara stepping over a broken barricade to kneel and tend a wounded enemy soldier the same way, refusing sides','a tracking move following her across the line',['amara','enemy','the-battlefield'],'she won’t let the dying be enemies'],
  ['s3','close-up','push-in','warming','Amara’s face — resolve and compassion in firelight','Amara’s face lit warm by a nearby fire, smeared with ash, holding compassion and iron resolve, human eyes','a slow push-in on her steady face',['amara'],'I’d rather save souls than surrender my soul'],
  ['s3','medium','locked-off','cold','Amara cradles a dying young soldier under drifting smoke','Amara cradling a dying young soldier’s head in her lap in the mud, smoke drifting, grief and tenderness, no gore','a still locked-off frame holding on them',['amara','the-battlefield'],'no more children paying powerful dues'],
  // ACT 5 — THE MIRROR
  ['s4','wide','tracking','cold','A soldier raises his rifle on an enemy across the field','A young soldier advancing through ash, shouldering his rifle and sighting on a single distant enemy across the open ground','a tracking move with him as the rifle comes up',['soldier','enemy','the-battlefield','the-rifle'],'march towards the enemy’s direction'],
  ['s4','close-up','push-in','cold','The enemy’s eyes — the mirror, the same fear','Close on the young enemy soldier’s frightened face through thinning smoke, the same fear and humanity as the man aiming at him','a slow push-in onto his locking eyes',['enemy','the-battlefield'],'he caught one kid’s eyes and caught his reflection'],
  ['s4','insert','push-in','warm','Memory flash — both their mothers, the same prayer','A warm split memory: two of the chorus mothers from different worlds, each praying the same prayer for a son','a slow push-in dissolving between the two mothers',['chorus'],'same mama praying on both sides'],
  ['s4','medium','tracking','warming','Amara steps between the two raised rifles, arms open','Amara walking grounded into the gap between the two aiming soldiers, arms opening wide, unafraid','a tracking move with her into the line of fire',['amara','soldier','enemy'],'she steps between the barrels'],
  ['s4','wide','tilt','cosmic','The same stars briefly overhead at the turning point','A momentary wheel of stars glimpsed through a tear in the war smoke directly above the frozen field','a slow tilt up through the smoke to the stars',['the-cosmos','the-battlefield'],'the cosmic witness over the choice'],
  // ACT 6 — THE REFUSAL
  ['s5','medium','push-in','warming','The first soldier lowers his rifle, looking at Amara','The young soldier lowering his barrel, his eyes moving from the enemy to Amara’s open hands, resolve breaking into mercy','a slow push-in as the barrel drops out of frame',['soldier','amara'],'he dropped that rifle, let mercy take hold'],
  ['s5','insert','push-in','warming','The rifle falls into the mud (the drop)','Close on a hand opening and a rifle falling from the grip into the churned mud, the cold light warming','a slow push-in following the rifle to the ground',['soldier','the-rifle','the-battlefield'],'one hand shook, one rifle fell'],
  ['s5','wide','crane','warming','The enemy raises empty hands to the sky','The young enemy soldier, seeing the rifle fall, slowly lifting both empty hands toward the opening sky','a crane rising with his lifting hands',['enemy','the-battlefield'],'one soldier still, with his hands to the skies'],
  ['s5','medium','push-in','warming','Amara’s hands join theirs over the dropped rifle','Amara clasping the two soldiers’ hands together over the dropped rifle in the mud, the three joined','a slow push-in on the three joined hands',['amara','soldier','enemy','the-rifle'],'peace began when somebody chose'],
  ['s5','wide','orbit','warming','A wide — the three of them still in the open field','A wide orbit of the three figures standing joined and unarmed in the middle of the vast open battlefield','a slow orbit around the three still figures',['amara','the-battlefield'],'one brave no, and the field goes still'],
  // ACT 7 — THE WOMEN WALK THE FIELD
  ['s6','wide','tracking','warming','The global women walk onto the battlefield from every side','Beautiful multicultural women from Act 2 walking grounded onto the smoking field from every direction, unafraid','a tracking move among the advancing women',['chorus','the-battlefield'],'the women walk onto the field'],
  ['s6','medium','push-in','warming','A mother lays a white flower on a rifle','A beautiful multicultural mother bending to lay a single white flower across a soldier’s laid-down rifle','a slow push-in on the flower on the steel',['chorus','laid-rifles'],'flowers where the rifles rest'],
  ['s6','medium','tracking','warming','A wife takes a soldier’s hand and turns him from the line','A beautiful multicultural woman taking a soldier’s hand and gently turning him away from the trench line','a tracking move as she leads him away',['chorus','soldier'],'turn somebody’s baby home, not to dust'],
  ['s6','medium','crane','warming','A daughter stands fearless between the trenches','A young beautiful multicultural woman standing tall and fearless in the open ground between two trenches','a crane rising above her lone fearless figure',['chorus','the-battlefield'],'fear got fragile when mercy got risky'],
  ['s6','establishing','drone','warming','An epic wide — hundreds of women flooding the field','An aerial epic of hundreds of beautiful multicultural women flooding across the battlefield between the armies','a soaring aerial drift over the flood of women',['chorus','the-battlefield'],'ten and ten thousand, no thunder, no sound'],
  // ACT 8 — THE RIPPLE EAST & WEST
  ['s7','insert','tracking','warming','Rifles laid down in shimmering rows','Close tracking along rows of rifles laid resting in the mud, wet steel catching the warming light','a tracking move along the shimmering rows',['laid-rifles','the-battlefield'],'steel stacking in shimmering rows'],
  ['s7','wide','crane','warming','Soldiers of both sides standing empty-handed','A wide of soldiers from both armies standing unarmed with open hands across the stilled field','a crane rising over the unarmed soldiers',['soldier','enemy','the-battlefield'],'rifles lay resting where red rivers flow'],
  ['s7','wide','pan','warming','A far ridge of soldiers lowering weapons','A distant ridge line of soldiers lowering their weapons in sequence against a warming dawn sky','a slow pan across the far ridge',['the-battlefield'],'the refusal spreading down the line'],
  ['s7','establishing','drone','warming','East — a desert front lays down arms at dawn','An aerial of a sunbaked desert front where soldiers and beautiful multicultural women lower arms at dawn','an aerial drift over the desert front',['the-desert','chorus'],'east, every enemy finally given a face'],
  ['s7','establishing','drone','cold','West — a snow front lays down arms at dawn','An aerial of a snow-covered western front where soldiers and women lower arms in the pale dawn','an aerial drift over the snow front',['the-snow','chorus'],'west, the soldiers withdrew'],
  // ACT 9 — POWER VANISHES / THE COST
  ['s8','medium','push-in','cold','The war-maps go dark, the commander’s power gone','The commander over his war-maps as the lit markers go dark one by one, his hands falling still, head bowing','a slow push-in as the maps go dark',['commander','the-bunker'],'generals grieving for power that vanished'],
  ['s8','wide','pullback','cold','The abandoned command, empty, the machine stalled','A slow pull-back from an abandoned command bunker, chairs empty, maps dark, the machine stopped','a slow pull-back from the empty command',['the-bunker'],'a war needs soldiers and the soldiers withdrew'],
  ['s8','medium','push-in','cold','A mother receives a folded letter at a lit door','A beautiful multicultural mother at a lit doorway, hands closing around a folded letter, pressing it to her chest','a slow push-in on her restrained grief',['chorus','the-village','the-letter'],'no more mothers with midnight notes'],
  ['s8','medium','locked-off','warm','The women hold each other in grief and relief','Several beautiful multicultural women from different worlds holding one another, tears of grief and relief','a still locked-off frame on the embrace',['chorus'],'everybody survived, but not everyone'],
  ['s8','close-up','push-in','warming','A single candle for the lost under the returning stars','A single candle flame cupped in a woman’s hands as the first evening stars return in the sky above','a slow push-in on the candle, stars rising behind',['chorus','the-cosmos'],'lose that love, lose that light'],
  // ACT 10 — THE RECLAIMING + THE SAME STARS
  ['s9','medium','push-in','warm','Reunions — the women embrace their returning men at dawn','Beautiful multicultural women embracing returning soldiers at warm village doorways and shorelines at dawn, tears of relief','a slow push-in on a reunion embrace',['chorus','soldier','the-village'],'nobody conquered, but everybody survived'],
  ['s9','wide','tracking','warm','Amara walks home through a field turning green','Amara walking grounded down a path through a battlefield turning green with new grass, warm dawn ahead','a tracking move following her home',['amara','the-battlefield'],'maybe winning is walking away'],
  ['s9','insert','pullback','warm','The dropped rifles in the mud catching the risen sun, green returning','Close pull-back from laid-down rifles half-sunk in mud, new green shoots rising around them in warm sun','a slow pull-back as green returns around the steel',['laid-rifles','the-battlefield'],'one rifle dropped, and the battle stopped'],
  ['s9','wide','crane','cosmic','Amara and the women beneath the first evening stars again','Amara and the chorus of beautiful multicultural women standing together on the green ridge beneath returning stars','a crane rising from the women toward the stars',['amara','chorus','the-ridge','the-cosmos'],'the same women, beneath the same sky'],
  ['s9','establishing','pullback','cosmic','The vast starfield over a healed earth — the same stars, now over peace','A vast pull-back into space from the dawn ridge to the whole starfield over a quiet healed earth','a slow pull-back into the cosmos over the healed earth',['the-cosmos'],'the same stars, now over peace'],
];

// ── 10 scenes (acts): valid causal + state chain ────────────────────────────
const CHAIN = [
  { id: 's0', title: 'The Same Stars', via: null,
    purpose: 'Open on the cosmic witness — the same stars over the whole earth and one woman beneath them — before the war begins at dawn.',
    learns: 'The same stars hang over every field and every home; one multicultural woman witnesses the dawn the war begins in.',
    es: ['the hush of the cosmos', 'the cold dawn the war begins in'],
    change: { sky: ['starlit', 'war-dawn'] }, sp: ['sp-stars'] },
  { id: 's1', title: 'The Women of the World', via: 'therefore',
    purpose: 'Introduce the global chorus — beautiful multicultural women on every continent, each tied to a soldier, each under the same fading stars.',
    learns: 'Across the world, beautiful multicultural women wait and pray for the men the war is about to take.',
    es: ['the cold dawn the war begins in', 'the tender ache of the women waiting'],
    change: { world: ['asleep', 'waking'] }, sp: ['sp-women'] },
  { id: 's2', title: 'The Crooked Order', via: 'therefore',
    purpose: 'The war machine sends the men — a crooked order down the wire to a trench of young soldiers; far off, the women feel it.',
    learns: 'A distant crooked command sends young men to the smoke, and the women feel the order land.',
    es: ['the tender ache of the women waiting', 'cold dread under the order'],
    change: { war: ['pending', 'begun'], machine: ['idle', 'running'] }, sp: ['sp-machine'] },
  { id: 's3', title: 'Amara on the Field', via: 'therefore',
    purpose: 'Amara the mercy-bearer crosses the battlefield tending the wounded of BOTH sides, refusing to let the dying be enemies.',
    learns: 'Amara moves through the war as mercy itself, tending both sides and refusing enemies.',
    es: ['cold dread under the order', 'the fierce tenderness of mercy under fire'],
    change: { amara: ['arriving', 'tending'] }, sp: [] },
  { id: 's4', title: 'The Mirror', via: 'but',
    purpose: 'A soldier aims at an enemy and catches his own reflection; their mothers pray the same prayer; Amara steps between the rifles under the stars.',
    learns: 'The enemy is a mirror — same fear, same mother — and Amara steps into the line of fire between them.',
    es: ['the fierce tenderness of mercy under fire', 'the held breath of recognition'],
    change: { refusal: ['none', 'recognized'] }, sp: ['sp-refusal'] },
  { id: 's5', title: 'The Refusal', via: 'therefore',
    purpose: 'The heart — the soldier drops his rifle, the enemy raises empty hands, and Amara joins their hands over the fallen weapon.',
    learns: 'The soldier lays down his rifle and the enemy raises empty hands — peace begins when somebody chooses.',
    es: ['the held breath of recognition', 'the courage of refusal'],
    change: { refusal: ['recognized', 'first'], war: ['begun', 'halting'] }, sp: ['sp-refusal'] },
  { id: 's6', title: 'The Women Walk the Field', via: 'therefore',
    purpose: 'The global women walk onto the battlefields, lay flowers on the rifles, and turn the soldiers from the line — the collective refusal.',
    learns: 'The beautiful multicultural women flood the field and end the war with flowers and open hands, not weapons.',
    es: ['the courage of refusal', 'awe as the women take the field'],
    change: { world: ['waking', 'rising'], refusal: ['first', 'collective'] }, sp: ['sp-women'] },
  { id: 's7', title: 'The Ripple East and West', via: 'therefore',
    purpose: 'Weapons come down across the whole world — shimmering rows, both sides standing, a desert front, a snow front — every enemy given a face.',
    learns: 'The refusal ripples east and west until the weapons are down across the whole world.',
    es: ['awe as the women take the field', 'the vast hush of a world laying down arms'],
    change: { war: ['halting', 'stopped'] }, sp: ['sp-rifle'] },
  { id: 's8', title: 'Power Vanishes, and the Cost', via: 'but',
    purpose: 'The machine’s power dies with no one to obey; a mother receives the midnight letter; the women grieve and hold each other under returning stars.',
    learns: 'The war machine’s power vanishes when the soldiers withdraw, but the cost is already paid in a folded letter.',
    es: ['the vast hush of a world laying down arms', 'grief held and shared'],
    change: { machine: ['running', 'vanished'], world: ['rising', 'grieving-held'] }, sp: ['sp-machine'] },
  { id: 's9', title: 'The Reclaiming and the Same Stars', via: 'therefore',
    purpose: 'Earned peace — the women reclaim their men, Amara walks home through a greening field, and the camera rises back to the same stars, now over peace.',
    learns: 'The women reclaim the living and the world heals; the same stars that opened the film now watch over peace.',
    es: ['grief held and shared', 'earned, hard-won peace under the same stars'],
    change: { sky: ['war-dawn', 'peace-stars'], war: ['stopped', 'peace'], amara: ['tending', 'home'] }, sp: ['sp-stars', 'sp-rifle'] }
];

// Build the evolving state object + per-scene start/end + justified changes.
const STATE0 = { sky: 'starlit', world: 'asleep', war: 'pending', amara: 'arriving', refusal: 'none', machine: 'idle' };
const CHARACTER_IDS = new Set(['amara', 'chorus', 'soldier', 'enemy', 'commander']);
const scenes = [];
let cur = { ...STATE0 };
CHAIN.forEach((sc, i) => {
  const start = { ...cur };
  const end = { ...cur };
  const justified = [];
  for (const [k, [from, to]] of Object.entries(sc.change)) {
    end[k] = to;
    justified.push(k);
  }
  const myShots = B.filter(b => b[0] === sc.id);
  const prot = myShots.flatMap(s => s[7]).find(r => CHARACTER_IDS.has(r)) || 'amara';
  const va = myShots.slice(0, 2).map(b => ({
    subject: b[7].find(r => CHARACTER_IDS.has(r)) || prot,
    action: b[4].toLowerCase(),
    subtext: b[8]
  }));
  scenes.push({
    id: sc.id, index: i, title: sc.title,
    narrativePurpose: sc.purpose,
    protagonist: prot,
    objective: sc.purpose,
    opposition: 'The war, the crooked order, and the fear that keeps the weapons raised.',
    visibleActions: va.length ? va : [{ subject: 'amara', action: sc.purpose.toLowerCase(), subtext: sc.learns }],
    decision: sc.learns,
    change: sc.learns,
    consequence: sc.learns,
    audienceLearns: sc.learns,
    emotionalStateStart: sc.es[0], emotionalStateEnd: sc.es[1],
    startState: start, endState: end,
    ...(justified.length ? { justifiedStateChanges: justified } : {}),
    causedByPreviousVia: sc.via,
    setupPayoffRefs: sc.sp,
    durationSec: myShots.length * 6
  });
  cur = end;
});

// Map beat framing -> a representative referenceAssets subject for protagonist fallback
const refSubjectIds = new Set(['amara', 'soldier', 'enemy', 'commander', 'chorus']);

// Build the 50 shots from the beats.
const shots = B.map((b, i) => {
  const [sceneId, f, m, g, subj, env, actionCore, refs, note] = b;
  const grade = GRADES[g];
  const movePhrase = MOVE[m] || 'a slow cinematic move';
  const dignified = refs.includes('chorus') || refs.includes('amara')
    ? 'beautiful multicultural women dignified + grounded, never exploitative; '
    : '';
  return {
    id: `p${i + 1}`,
    sceneId,
    index: i,
    durationSec: 6,
    subject: subj,
    environment: env,
    action: actionCore,
    cameraFraming: f,
    cameraMovement: m,
    lensIntention: 'anamorphic 35mm, 2.39 letterbox',
    lighting: grade.light,
    emotionalIntention: note,
    temporalProgression: `${actionCore}; ${movePhrase}`,
    continuityConstraints: [
      `${grade.vp}, 2.39 letterbox, fine grain, no text, no flags`,
      `${dignified}people GROUNDED always, never floating; human eyes`,
      'NO superimposed HUD/holograms/floating type; violence oblique, no gore'
    ],
    referenceAssets: refs.filter(r => !refSubjectIds.has(r) ? true : true),
    startStateRef: `scene=${sceneId}`,
    endStateRef: `scene=${sceneId}`,
    transition: 'cut',
    audio: { dialogue: false, music: true, sfx: ['scored to the track'], silence: false, note },
    model: {
      provider: 'minimax', modelId: 'MiniMax-Hailuo-02',
      rationale: 'MiniMax Hailuo-02 for the whole film (one model = consistency); permissive, 1080p, cap-compliant $0.25/s. Unique beat, used once (no repeat footage).',
      estCostUsd: 1.5, dryRun: true
    },
    qualityConstraints: [
      'hyper-real, convincing paused AND in motion; ARRI/35mm anamorphic',
      `${grade.vp}; grounded; no warping; no CGI-plastic look`,
      dignified ? 'beautiful multicultural women dignified, never exploitative' : 'photoreal, human proportions'
    ],
    keyframePrompt: `${subj}, ${env}, ${grade.kf}, HBO-grade cinematic, 2.39 letterbox, fine grain, no text`,
    veoPrompt: `${actionCore}; ${env}. ${movePhrase}. Hyper-real, 35mm anamorphic, ${grade.vp}, grounded, human eyes, ${dignified ? 'dignified beautiful women, ' : ''}no blood, no gore, no text, no flags.`,
    useHeroAsFirstFrame: false,
    seedanceRef: false,
    negativePrompt: NEG
  };
});

const manifest = {
  id: 'the-last-soldier-refused',
  createdAtIso: '2026-10-25T00:00:00Z',
  brief: {
    concept:
      'Cinematic music FILM for bZ’s "The Last Soldier Refused" — REDO with NO REPEAT FOOTAGE: 50 UNIQUE beats spanning the full 4:52, each used ONCE. Epic women-led, cosmic-framed storyline "The Women Who Stopped the War": AMARA, a beautiful multicultural mercy-bearer on the battlefield, and a global chorus of beautiful multicultural women who walk onto the fields and end the war — all framed by the SAME STARS (the cosmic witness: open, mid, close). Hyper-real, HBO-level, ARRI/35mm anamorphic 2.39. Grade: cosmic starfield ↔ cold blue-grey war ↔ warm golden home, cold warming as mercy spreads. People GROUNDED always; beautiful multicultural women FAVORED as leads, dignified + never exploitative; violence OBLIQUE (no blood/gore); NO HUD/holograms/floating type. Each cut is fresh — no shot ever repeats.',
    durationSec: 292.2,
    aspectRatio: '2.39:1',
    mood: 'epic, haunting, tender, redemptive; the women and the stars that ended a war',
    format: 'music-video',
    song: { title: 'The Last Soldier Refused', bpm: 82 }
  },
  logline:
    'Beneath the same stars that watch every war, a multicultural mercy-bearer and a chorus of beautiful women the world over walk onto the battlefields, refuse the war their men were sent to fight, and end it — and the stars that opened on war close on peace.',
  synopsis:
    'The film opens in the cosmos — the same stars over the whole dark earth, and one woman, Amara, witnessing the dawn the war begins in. Across the world beautiful multicultural women wait and pray for the men a crooked chain of command is about to send into the smoke. On the field, Amara the mercy-bearer tends the wounded of both sides, refusing to let the dying be enemies. A soldier raises his rifle on an enemy and catches his own reflection — the same fear, the same mother’s prayer — and Amara steps between the barrels as the stars wheel overhead. The soldier drops his rifle, the enemy raises empty hands, and the women of the world walk onto the battlefields, laying flowers on the rifles and turning the soldiers home. The refusal ripples east and west until the weapons are down across the whole earth; the war machine’s power vanishes with no one left to obey, though a folded letter has already reached one mother’s door. The women reclaim the living, the fields turn green, and the camera rises back into the cosmos — the same stars, now watching over peace.',
  characters: [
    { id: 'amara', name: 'Amara', description: 'The lead — a beautiful multicultural woman, a battlefield mercy-bearer/medic, early 30s, grounded and fierce and tender. The visual embodiment of the song’s female voice; she crosses the field refusing enemies and steps between the rifles. Human eyes always, dignified, powerful, never exploitative.', state: { position: 'ridge' }, externalGoal: 'Stop the killing on the field by refusing to let the dying be enemies', internalNeed: 'To prove mercy is stronger than any order', contradiction: 'To save them she must walk unarmed into the line of fire', voice: 'Silent, steady; speaks in action — a kneel, a crossing of the line, arms opened between two rifles', vulnerabilities: ['the open ground between the guns'], blindSpots: ['how far one refusal can spread'], relationships: { chorus: 'the women of the world who walk the field with her' } },
    { id: 'chorus', name: 'The Women of the World', description: 'A global chorus of beautiful multicultural women — Black, Latina, East/South/Southeast Asian, Middle-Eastern, mixed — mothers, wives, sisters, daughters, each tied to a soldier, each under the same stars. Intentionally varied; dignified, grounded, powerful, never exploitative. They walk onto the battlefields and end the war.', state: { position: 'home', status: 'waiting' }, externalGoal: 'Bring their men home alive and end the war', internalNeed: 'To refuse to pay the war’s price in their own sons and husbands', contradiction: 'They can only end it by walking unarmed onto the killing fields', voice: 'Prayer, a hand on glass, a flower laid on a rifle, a body between the trenches', vulnerabilities: ['the midnight letter at the door'], blindSpots: ['that their refusal would topple the war itself'], relationships: { amara: 'the mercy-bearer who leads them onto the field' } },
    { id: 'soldier', name: 'The Soldier', description: 'A young soldier at the trigger who becomes the first to refuse — grimed, gentle under the fear, unmarked uniform, human eyes, grounded. The one brave no.', state: { weapon: 'shouldered' }, externalGoal: 'Obey the order and survive', internalNeed: 'To keep his soul and go home', contradiction: 'Refusing could cost his life; obeying would cost his soul', voice: 'A lowered barrel, a rifle let fall', vulnerabilities: ['the order and the rifle in his hands'], blindSpots: ['that the enemy is the same as him'], relationships: { enemy: 'the mirror across the field', amara: 'the mercy that stays his hand' } },
    { id: 'enemy', name: 'The Soldier Across the Field', description: 'A young enemy soldier in a different unmarked uniform, the same age and fear — the mirror whose eyes the soldier catches. Raises empty hands when the rifle falls. Human eyes, grounded, no flag.', state: { weapon: 'raised' }, externalGoal: 'Survive the rifle aimed at him', internalNeed: 'To be seen as a person, not a target', contradiction: 'He must keep his weapon up to live', voice: 'Eyes meeting eyes, then two empty hands to the sky', vulnerabilities: ['the open ground'], blindSpots: ['that mercy would come from the other side first'], relationships: { soldier: 'the enemy who refuses to fire' } },
    { id: 'commander', name: 'The Commander', description: 'An older officer, the face of the war machine in the cold bunker, who issues the crooked order and watches his power vanish when the soldiers withdraw. Dignified, not caricature.', state: { position: 'bunker' }, externalGoal: 'Win the war and hold power', internalNeed: 'To believe his orders move the world', contradiction: 'His power exists only while the boys obey', voice: 'A gloved hand on a map, then a bowed, powerless head', vulnerabilities: ['a chain of command that only works if obeyed'], blindSpots: ['that power stops being power when people stop believing'], relationships: { soldier: 'one of the boys he sends into the smoke' } }
  ],
  locations: [
    { id: 'the-cosmos', name: 'The Cosmos', description: 'A vast photoreal starfield / deep space — the Milky Way over the curve of the earth. The cosmic witness that opens, punctuates, and closes the film; the same stars over every field and home.' },
    { id: 'the-ridge', name: 'The Ridge', description: 'A high ridge at the edge of dawn where Amara stands beneath the whole sky — cosmic above, the war-world below.' },
    { id: 'the-village', name: 'The Village', description: 'Warm-lit village doorways at dawn where mothers pray and candles are lit — the home-world the war threatens.' },
    { id: 'the-city', name: 'The City', description: 'A waking city of high windows and rooftops where wives and sisters watch the horizon at dawn.' },
    { id: 'the-shore', name: 'The Shore', description: 'A dawn shoreline where a daughter stands in the sea wind — the world’s edge, warm light.' },
    { id: 'the-bunker', name: 'The Command Bunker', description: 'A cold concrete command post of lit war-maps and shadowed officers — the face of the war machine; where the order issues and later goes dark.' },
    { id: 'the-trench', name: 'The Trench', description: 'A ruined front-line trench of young soldiers in cold blue-grey dawn, mud and barbed wire and thin smoke.' },
    { id: 'the-battlefield', name: 'The Battlefield', description: 'The cratered open field between the lines — ash and smoke, where Amara crosses, the mirror and refusal happen, the women walk, and green returns at the end.' },
    { id: 'the-desert', name: 'The Desert Front', description: 'A sunbaked eastern front where soldiers and women lower arms at dawn — the global ripple, east.' },
    { id: 'the-snow', name: 'The Snow Front', description: 'A snow-covered western front where arms are laid down in the pale dawn — the global ripple, west.' }
  ],
  props: [
    { id: 'the-rifle', name: 'The Rifle', description: 'The soldier’s rifle — raised on the enemy, then dropped into the mud; the central motif, by the end half-sunk with green rising around it.', state: { status: 'shouldered' } },
    { id: 'laid-rifles', name: 'The Laid-Down Rifles', description: 'Rows of rifles laid resting in the mud across the field — flowers on the steel, green returning — the proof of ten thousand refusals.', state: { status: 'absent' } },
    { id: 'the-letter', name: 'The Folded Letter', description: 'The midnight note placed into a mother’s hands — the cost of the war, rendered with grief, never gore.', state: { status: 'undelivered' } }
  ],
  wardrobe: [
    { id: 'amara-garb', name: 'Amara’s Medic Garb', description: 'Worn battlefield medic garb with a red-cross armband — no flag, no nation; ash-smeared on the field, warm-lit at the homecoming.', state: { condition: 'worn' } }
  ],
  setupPayoffs: [
    { id: 'sp-stars', detail: 'The same stars over the earth', setupSceneId: 's0', payoffSceneId: 's9', initialMeaning: 'The cosmic witness over the dawn the war begins in', finalMeaning: 'The same stars, now watching over peace', isMotif: true },
    { id: 'sp-women', detail: 'The beautiful multicultural women of the world', setupSceneId: 's1', payoffSceneId: 's6', initialMeaning: 'Women the world over waiting and praying for their men', finalMeaning: 'The women walk onto the battlefields and end the war', isMotif: true },
    { id: 'sp-machine', detail: 'The crooked war machine', setupSceneId: 's2', payoffSceneId: 's8', initialMeaning: 'The brass sending boys to the smoke by a crooked order', finalMeaning: 'The machine’s power vanishes when the soldiers withdraw', isMotif: true },
    { id: 'sp-refusal', detail: 'The raised rifle and the mirror', setupSceneId: 's4', payoffSceneId: 's5', initialMeaning: 'A target through the smoke in the enemy’s direction', finalMeaning: 'The rifle dropped, the enemy’s empty hands, peace begun', isMotif: true },
    { id: 'sp-rifle', detail: 'The rifles of the war', setupSceneId: 's7', payoffSceneId: 's9', initialMeaning: 'Steel laid resting in shimmering rows', finalMeaning: 'Half-sunk in mud with green rising around them', isMotif: true }
  ],
  emotionalTrajectory: [
    'the hush of the cosmos', 'the tender ache of the women waiting', 'cold dread under the order',
    'the fierce tenderness of mercy under fire', 'the held breath of recognition', 'the courage of refusal',
    'awe as the women take the field', 'the vast hush of a world laying down arms', 'grief held and shared',
    'earned, hard-won peace under the same stars'
  ],
  scenes,
  shots,
  budget: { maxUsd: 85, spentUsd: 0, requireApproval: true },
  qualityAcceptance: [
    'NO REPEAT FOOTAGE — 50 UNIQUE beats, each clip used ONCE, spanning the full 4:52 (concat, not pool-cycling)',
    'Hyper-real HBO/ARRI 35mm anamorphic 2.39; grade flows cosmic ↔ cold war ↔ warm home, cold warming as mercy spreads',
    'ONE model (MiniMax Hailuo-02) across the film for consistency — Amara stable shot-to-shot',
    'BEAUTIFUL MULTICULTURAL WOMEN favored as leads (Amara + the global chorus), dignified + grounded, never exploitative',
    'People GROUNDED always (walk/kneel/reach/embrace, NEVER floating)',
    'Violence OBLIQUE and dignified — no blood, no gore',
    'The STARS frame the film (open, mid-turn, close) as the cosmic witness motif',
    'Epic women-led plot tracking the lyric: the women and the stars that ended a war',
    'NO superimposed HUD/holograms/floating type; unmarked uniforms, no flags',
    'Score to the original 4:52 (292.2s) master; MiniMax native audio discarded'
  ]
};

await writeFile(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest written: ${manifest.shots.length} shots, ${manifest.scenes.length} scenes -> ${OUT}`);
