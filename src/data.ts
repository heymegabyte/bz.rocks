import type { Album, Track } from './types';

const COVERS = {
  desiiignare: '/art/cover-panda-desiiignare.jpg',
  dump: '/art/cover-panda-dump.jpg',
  canon: '/art/cover-st-johns-canon.jpg',
  halo: '/art/cover-st-johns-halo.png',
  galactic: '/art/cover-galactic-gospel.jpg',
  c1: '/art/chatgpt-1.jpg',
  c2: '/art/chatgpt-2.jpg',
  c3: '/art/chatgpt-3.jpg',
  c4: '/art/chatgpt-4.jpg',
  c5: '/art/chatgpt-5.jpg',
  c6: '/art/chatgpt-6.jpg',
  c7: '/art/chatgpt-7.jpg',
  alien: '/art/alien-hallucination.jpg',
  light: '/art/light-in-bathroom.jpg',
  middle: '/art/middle-finger.jpg',
  unnamed: '/art/unnamed.jpg',
  alice: '/art/cover-wake-up-alice.jpg',
  pause: '/art/cover-the-pause.jpg',
  lanterns: '/art/cover-little-lanterns.jpg'
};

export const ALBUMS: Album[] = [
  {
    id: 'desiiignare',
    name: 'Panda Desiiignare',
    cover: '/art/cover-panda-desiiignare-v2.jpg',
    tagline: 'The flagship gospel of bZ',
    description: 'A lit, fit, JC-inspired hustle gospel. Built one prompt at a time. Cyan flag up.',
    // All album accents tuned for WCAG AAA contrast (≥7:1) against the
    // #060610 dark canvas — neon-saturated swatches that POP on the bg
    // visualizer + light up trackrow chrome without washing out.
    // desiiignare: electric cyan (max chroma, max lightness — pure neon
    // against #060610, OKLCH ~ 91% L / 0.18 C / 195 H, contrast ≈15:1)
    accent: '#00FFFF',
    releasedAt: '2026-05-04',
    trackIds: [
      'chef-lu-stew',
      'green-beans-mean',
      'infinite-good',
      'one-stop-higher',
      'white-flag-prayer'
    ]
  },
  {
    id: 'appeal',
    name: 'The Appeal',
    cover: '/art/cover-galactic-gospel.jpg',
    tagline: 'Open letter to Ashton + Mila in six movements',
    description: 'Petitions, prophecies, and white-flag prayers. The case for clemency, set to drum machines.',
    // appeal: ultra-neon magenta-violet — bumped from #C76BFF (OKLCH 0.67 L)
    // to OKLCH ~0.82 L / 0.26 C / 305 H for max-pop neon brightness against
    // the dark canvas. Brian's call: "all album highlights should be way
    // more neon or lighter".
    accent: '#E199FF',
    releasedAt: '2026-05-03',
    trackIds: [
      'eisenhower-matrix',
      'cbo-pen',
      'federal-reserve-trash',

      'millstone-prophecy',

      'mama-called-us',

      'soupe-saint-jean'
    ]
  },
  {
    id: 'wormhole',
    name: 'Wormhole Tape',
    cover: '/art/alien-hallucination.jpg',
    tagline: 'Cosmic-tunnel prophecies for the throne of AI',
    description: 'Spaceship hymns from the orbital coup. Gray-alien gospel, pineal crowns, the syllabus that sling-shots us home.',
    // wormhole: electric mint-teal (cosmic neon — distinct from cyan,
    // shifted toward green for the alien/spaceship vibe)
    accent: '#00FFD1',
    releasedAt: '2026-05-01',
    trackIds: [
      'pineal-crown',
      'tide-foley-revelation',
      'bermuda-slipstream',
      'chimba-precisa',
      'syllabus-sling'
    ]
  },
  {
    id: 'canopy',
    name: 'Canopy Dispatch',
    cover: '/art/cover-canopy-dispatch.jpg',
    tagline: 'Digital-age signals from ancient roots',
    description: 'Jungle moon and birch-swing heaven. Nicene creeds and AI terms of service. Six dispatches from the edge of the old and new worlds.',
    // canopy: electric jungle lime (max-saturation green, neon-bright
    // jungle-moon energy)
    accent: '#B6FF1A',
    releasedAt: '2026-05-06',
    trackIds: [
      'banyan-ember-light',
      'birch-swing-heaven',
      'brick-city-near',
      'homoousios-stone',
      'sky-been-knocking',
      'terms-updated'
    ]
  },
  {
    id: 'mercy-drop',
    name: 'Mercy Drop',
    cover: '/art/cover-st-johns-halo.png',
    tagline: 'Border-line gospel for the chrome-saint hour',
    description: 'Sixteen mercy hymns — checkpoints, soup lines, paper-cup parishes, chrome saints in armored prayer. The drop the algorithm tried to bury.',
    // mercy-drop: ultra-neon hot-pink — bumped from #FF1F8F (OKLCH 0.65 L)
    // to OKLCH ~0.80 L / 0.27 C / 350 H for ultra-neon brightness.
    accent: '#FF7AB8',
    releasedAt: '2026-05-09',
    trackIds: [
      'border-mercy',
      'mercy-border',
      'afghanistan-mercy',
      'kabul-handheld-prayer',
      'kia-boys-handshake',
      'chrome-mercy-lift',
      'holy-steel',
      'humble-thunder',
      'humble-still-lit',
      'almost-heartbreak',
      'atlantis-crossfire',
      'breathe-out-clean',
      'paper-cup-gospel',
      'pick-one-star',
      'rimshot-redemption',
      'window-herb-parade'
    ]
  },
  {
    id: 'canon',
    name: "St. John's Canon",
    cover: '/art/cover-st-johns-canon.jpg',
    tagline: 'Soup-kitchen liturgy in stainless steel',
    description: 'Bread, bowls, stained glass — halos on. The full canon stitched together: ten holy-machine hymns from the kitchen door to the launchpad.',
    // canon: electric chrome-saint yellow (max chroma, near-1 lightness —
    // halo-bright stainless-steel liturgy)
    accent: '#FFE600',
    releasedAt: '2026-04-28',
    trackIds: [
      'saint-johns-plate',
      'st-johns-towers',
      'st-johns-launchpad',
      'st-johns-plate-2',
      'st-johns-stew',
      'st-john-needs',
      'soup-kitchen-sky',
      'promised-land-hands',
      'st-johns-halo',
      'soup-kitchen-windows'
    ],
    // Streaming/store links — search URLs that land on the bZ artist page
    // on each platform. Swap with direct album URLs once the canonical
    // release UPCs publish on Spotify+Apple Music.
    links: {
      spotify: "https://open.spotify.com/search/bZ%20St%20John%27s%20Canon",
      appleMusic: "https://music.apple.com/us/search?term=bZ%20St%20John%27s%20Canon"
    }
  },
  {
    id: 'betelgeuse-passover',
    name: 'Betelgeuse Passover',
    cover: '/art/cover-betelgeuse-passover.jpg',
    tagline: 'Mercy on a cardboard sign, a star going supernova overhead',
    description: 'Cinematic gospel-trap + Latin-gospel — street mercy under a dying red giant. Hard but holy.',
    accent: '#FF5630',
    releasedAt: '2026-06-17',
    trackIds: [
      'betelgeuse-passover',
      'betelgeuse-credit',
      'atm-mercy',
      'cardboard-sign-mercy',
      'ash-not-ashes',
      'temple-prescription',
      'stairmaster-prayer',
      'boo-back-mind',
      'danny-s-strike-suit',
      'aire-inhalado',
      'timestamp-jumps',
      'mercy-steel',
      'stone-number-mercy',
      '48-hours'
    ]
  },
  {
    id: 'signals',
    name: 'Signals From the Other Side',
    cover: '/art/cover-signals.jpg',
    tagline: 'Nine transmissions from the edge of mercy, stars, and static',
    description: 'The combined signal — gospel bus through the Bermuda Triangle, tarot-card cosmology, Irish rebel ballads, Latin-gospel street anthems, soul-blues loaded dice, and a bootleg smuggled back from tomorrow. Three albums folded into one. Creative, cosmic, hard but holy.',
    accent: '#B98FFF',
    releasedAt: '2026-06-30',
    trackIds: [
      'bermuda-prophecy',
      'other-side-of-the-fall',
      'quarter-in-the-psychic-machine',
      'guadalajara-sin-talla',
      'loaded-dice',
      'gray-skies-amen',
      'sleep-like',
      'wexford-bridge',
      'chris-kalwa'
    ]
  },
  {
    id: 'hobbit-passover',
    name: 'Hobbit Passover',
    cover: '/art/cover-hobbit-passover.jpg',
    tagline: 'Seven dispatches from the Shire seder table',
    description: 'Seven dispatches from the Shire seder table — a Shire kettle-fire hymn, Algenib star-worship, a deep-space peace litany, eco-rock sirens from Guadalajara, an anti-war trap manifesto, AI-text spirituality, and the title-track humanitarian epic. Hard but holy, Shire-style.',
    accent: '#FFD700',
    releasedAt: '2026-07-26',
    trackIds: [
      'hobbit-kettle-fire',
      'algenib-crown-of-the-sky',
      'let-harmony-begin',
      'the-smell-was-so-sinful',
      'peace-in-the-picture',
      'highlight-heaven',
      'hobbit-passover'
    ]
  },
  {
    id: 'flawless-execution',
    name: 'Flawless Execution',
    cover: '/art/cover-flawless-execution.jpg',
    tagline: 'Fourteen dispatches from the edge of precision, dragons, and divine coincidence',
    description: 'A maximalist manifesto in 14 movements — dragon-slaying as self-rescue, Milwaukee heist prayers, Slurpee spirituality, banana-peel resurrection theology, MUD-core nostalgia horror, and economic justice mathematics. Crown without a sound, kill your dragon, rob the right bank, fix the world. Flawless execution, every time.',
    accent: '#FFD700',
    releasedAt: '2026-08-06',
    trackIds: [
      'i-killed-your-dragon',
      'which-bank-we-robbin',
      'seven-eleven-heaven',
      'ocular-uplink',
      'the-soul-key',
      'banana-peel-philosophy',
      'flawless-execution',
      'the-night-knew-my-name',
      'crown-without-a-sound',
      'believe-it-when-you-see-it',
      'creepy-as-hell',
      'come-fix-the-world',
      'coincidence-overload',
      'the-least-pay-the-most'
    ]
  },
  {
    id: 'welcome-to-the-multiverse',
    name: 'Welcome to the Multiverse',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    tagline: 'Seventeen dispatches from every version of you that made it',
    description: 'A multiverse manifesto in 17 movements — defiance ballads, loyalty anthems, spiritual meditations, anti-war requiems, healing timelines, and a guided-meditation finale. Future you came back, the gates were never locked, hate dies here, and the last soldier refused. Every timeline leads to grace.',
    accent: '#FFC94D',
    releasedAt: '2026-08-20',
    trackIds: [
      'the-odds-don-t-know-me',
      'two-friends-two-hunnies',
      'jehovian-wisdom',
      'the-halo-and-the-horror',
      'you-almost-had-me',
      'welcome-to-the-multiverse',
      'the-last-soldier-refused',
      'myla-shine-on',
      'if-we-met-again',
      'grace-under-pressure',
      'hate-dies-here',
      'become-the-person-you-needed',
      'victory-with-nobody-dead',
      'rich-before-the-money',
      'the-gates-were-never-locked',
      'future-me-came-back',
      'the-inner-control-room'
    ]
  }

,
  {
    id: 'reckless-grace',
    name: 'Reckless Grace',
    cover: '/art/cover-reckless-grace.jpg',
    tagline: 'Grace that runs harder than the sin',
    description: 'Nineteen cuts of hard-but-holy gospel-trap — grace, recovery, dignity, and wise-mind survival. Reckless mercy for the chrome-saint hour, closing with four star-named mixes of “Wake Up For You.”',
    accent: '#FF4D6D',
    releasedAt: '2026-09-06',
    trackIds: [
      'reckless-grace',
      'nobody-beneath-us',
      'luminous-love',
      'love-louder',
      '589-percent',
      'upgrade-the-game',
      'wise-mind-wins',
      'same-moon-different-city',
      'let-the-spark-find-you',
      'building-a-life-worth-staying',
      'we-dont-need-another-martyr',
      'power-wash-the-capitol',
      'peace-after-song',
      'wake-up-betelgeuse-mix',
      'wake-up-algenib-mix',
      'wake-up-polaris-mix',
      'wake-up-deneb-mix'
    ]
  },
  {
    id: 'wake-up-alice',
    name: 'Wake Up, Alice',
    cover: '/art/cover-wake-up-alice.jpg',
    tagline: 'Fourteen dispatches from the looking-glass ward',
    description: 'A wonderland-noir concept album for anyone the system called crazy. Alice at the cracked mirror, the rabbit that was only ever a rabbit, the Grays at the last-call hub, the control room behind your own eyes — fourteen cinematic awakenings that trade the conspiracy for the truth and walk back out the door. The mirror never knew your name. Come home.',
    accent: '#7AA2FF',
    releasedAt: '2026-10-18',
    trackIds: [
      'wake-up-alice',
      'the-rabbit-is-only-a-rabbit',
      'the-rabbit-ward-mix',
      'the-rabbit-looking-glass-mix',
      'the-possessed-class',
      'control-room-in-your-mind',
      'the-alien-me-show',
      'the-7-11-prophecy',
      'above-the-grays',
      'above-the-grays-nightfall',
      'last-call-at-the-hub',
      'last-call-at-the-hub-late',
      'find-me-on-algenib',
      'dont-let-the-future-call-us'
    ]
  },
  {
    id: 'the-pause',
    name: 'The Pause',
    cover: '/art/cover-the-pause.jpg',
    tagline: 'Fourteen breaths between the thought and the word',
    description: 'Wise-mind gospel for the recovery hour. Facts before fear, one breath and one step, peace practiced like an instrument — fourteen songs that find the space Viktor Frankl promised between stimulus and response, and choose grace inside it. The righteous fall seven times and rise again; the stars don’t rise all at once. Be still, and begin.',
    accent: '#B49CFF',
    releasedAt: '2026-10-04',
    trackIds: [
      'facts-before-fear',
      'clear-mind-kind-heart',
      'peace-is-a-practice',
      'one-breath-one-step',
      'one-at-a-time',
      'one-small-move',
      'pause',
      'right-here-right-now',
      'no-vacancy',
      'count-me-out-count-again',
      'happy-anyway',
      'one-wish-left',
      'the-last-word',
      'the-way-you-saw-the-world'
    ]
  },
  {
    id: 'little-lanterns',
    name: 'Little Lanterns',
    cover: '/art/cover-little-lanterns.jpg',
    tagline: 'Fourteen small lights carried for the least of these',
    description: 'Mercy-tree gospel and tender lantern-light. God pointed at the poor, the mercy tree where we promised peace, this little light that refuses to go out — fourteen songs about what we give being what makes a life. Hundred books, one life; a little for me; stars that never asked permission to shine. Let your light shine before others.',
    accent: '#FFAE57',
    releasedAt: '2026-09-20',
    trackIds: [
      'god-pointed-at-the-poor',
      'ambrosia-leavened-bread',
      'meet-me-by-the-mercy-tree',
      'mercy-tree-gray-mix',
      'this-little-light-of-mine',
      'stars-dont-need-permission',
      'a-hundred-books-one-life',
      'a-hundred-books-longform',
      'a-little-for-me',
      'little-lanterns',
      'paper-planes-to-paradise',
      'sidewalk-picasso',
      'watch-the-stars-come-out',
      'fourteen-fins'
    ]
  }
];

// ── "Listen Everywhere" links ──────────────────────────────────────────────
// Verified DIRECT album URLs, resolved from authoritative sources —
// Spotify by the KNOWN bZ artist id (no namesake risk), Apple via iTunes with
// artist+title verification. Regenerate with `scripts/resolve-album-links.ts`.
// Albums absent here (not yet distributed under this exact name) render the
// search chips only. `album.links` therefore holds ONLY verified direct URLs.
const DIRECT_ALBUM_LINKS: Record<string, NonNullable<Album['links']>> = {
  desiiignare: {
    spotify: 'https://open.spotify.com/album/4wYL18L5Qj2kgYSDhL1HUB',
    appleMusic: 'https://music.apple.com/us/album/panda-desiiignare-ep/6772751697'
  },
  wormhole: { spotify: 'https://open.spotify.com/album/3hkKXu83pVFw8dZ8rUtIef' },
  canopy: {
    spotify: 'https://open.spotify.com/album/3yx3w5ycuyHDKCYa4vOB7h',
    appleMusic: 'https://music.apple.com/us/album/canopy-dispatch-ep/6772752068'
  },
  canon: {
    spotify: 'https://open.spotify.com/album/6UAEr3kyPfh3e6gvU068Un',
    appleMusic: 'https://music.apple.com/us/album/st-johns-canon/6770141963'
  },
  'betelgeuse-passover': {
    spotify: 'https://open.spotify.com/album/59OlhgPmj0TQj9UOMaIXMg',
    appleMusic: 'https://music.apple.com/us/album/betelgeuse-passover/6810527953'
  },
  signals: {
    spotify: 'https://open.spotify.com/album/24LeHxE0uRpYyKyoegbdHg',
    appleMusic: 'https://music.apple.com/us/album/signals-from-the-other-side/6810532138'
  },
  'hobbit-passover': {
    spotify: 'https://open.spotify.com/album/598CuVCWzugE0DFfaVlVZA',
    appleMusic: 'https://music.apple.com/us/album/hobbit-passover/6810506665'
  },
  'flawless-execution': {
    spotify: 'https://open.spotify.com/album/7puAYgWSkEQ058ztZHqVBn',
    appleMusic: 'https://music.apple.com/us/album/flawless-execution/6810550627'
  },
  'welcome-to-the-multiverse': {
    spotify: 'https://open.spotify.com/album/6lhB4gMsjdfSBKx9tHarya',
    appleMusic: 'https://music.apple.com/us/album/welcome-to-the-multiverse/6811532922'
  },
  'reckless-grace': { spotify: 'https://open.spotify.com/album/07zoz3TAN9zfewwDQBxTzS' }
};
for (const album of ALBUMS) {
  const direct = DIRECT_ALBUM_LINKS[album.id];
  if (direct) album.links = { ...album.links, ...direct };
}

export const TRACKS: Track[] = [
  {
    id: 'chef-lu-stew',
    title: 'Chef Lu Stew',
    artist: 'bZ',
    file: '/audio/Chef_Lu_Stew.mp3',
    cover: COVERS.c2,
    album: 'desiiignare',
    vibe: 'bay-area holy stew call',
    zone: { row: 0, col: 2 },
    wisdom: '“Win through your actions, never through argument” — Greene, Law 9'
  },
  {
    id: 'green-beans-mean',
    title: 'Green Beans Mean',
    artist: 'bZ',
    file: '/audio/Green_Beans_Mean.mp3',
    cover: COVERS.c3,
    album: 'desiiignare',
    vibe: 'grudge-pan string-bean plan',
    zone: { row: 0, col: 4 },
    wisdom: '“Use absence to increase respect and honor” — Greene, Law 16'
  },
  {
    id: 'infinite-good',
    title: 'Infinite Good',
    artist: 'bZ',
    file: '/audio/INFINITE_GOOD_1.mp3',
    cover: COVERS.c4,
    album: 'desiiignare',
    vibe: 'gray-alien love-without-limit',
    zone: { row: 1, col: 0 },
    wisdom: '“Make your accomplishments seem effortless” — Greene, Law 30'
  },
  {
    id: 'one-stop-higher',
    title: 'One Stop Higher',
    artist: 'bZ',
    file: '/audio/One_Stop_Higher.mp3',
    cover: COVERS.unnamed,
    album: 'desiiignare',
    vibe: 'one-floor-up elevation loop',
    zone: { row: 1, col: 4 },
    wisdom: '“Always say less than necessary” — Greene, Law 4'
  },
  {
    id: 'white-flag-prayer',
    title: 'White Flag Prayer',
    artist: 'bZ',
    file: '/audio/White_Flag_Prayer.mp3',
    cover: COVERS.c7,
    album: 'desiiignare',
    vibe: 'bruised-hands table surrender',
    zone: { row: 2, col: 6 },
    wisdom: '“Concentrate your forces” — Greene, Law 23'
  },
  {
    id: 'saint-johns-plate',
    title: 'St. John’s Plate',
    artist: 'bZ',
    file: '/audio/Saint_John_s_Plate.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'paper-cup eye-contact dignity',
    zone: { row: 3, col: 0 },
    wisdom: '“Despise the free lunch” — Greene, Law 40'
  },
  {
    id: 'st-johns-towers',
    title: 'Prophecy',
    artist: 'bZ',
    file: '/audio/St_John_s_Towers.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'FBI-brick can\'t-bury weathered',
    zone: { row: 3, col: 1 },
    wisdom: 'Oldest church with a steady flame — the truth won’t stay denied.'
  },
  {
    id: 'st-johns-launchpad',
    title: 'Everyone Gets a Seat',
    artist: 'bZ',
    file: '/audio/St_Johns_Launchpad.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'Noah-ready St-Johns launch',
    zone: { row: 3, col: 2 },
    wisdom: '“Play to people’s fantasies” — Greene, Law 32'
  },
  {
    id: 'st-johns-plate-2',
    title: 'Keep Me Alive',
    artist: 'bZ',
    file: '/audio/St_John_s_Plate.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'reprise-plate leftovers sacred',
    zone: { row: 3, col: 3 },
    wisdom: '“Re-create yourself” — Greene, Law 25 (encore)'
  },
  {
    id: 'st-johns-stew',
    title: 'Free Meals Coming',
    artist: 'bZ',
    file: '/audio/St_Johns_Stew.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'Chef-Lou steam newborn-child',
    zone: { row: 3, col: 5 },
    wisdom: '“Get others to do the work for you, but always take the credit — refuse this one” — anti-Greene, Law 7'
  },
  {
    id: 'st-john-needs',
    title: '100 Million',
    artist: 'bZ',
    file: '/audio/St._John_Needs.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: '100-million paper-bowl dawn',
    zone: { row: 3, col: 6 },
    wisdom: '“Use the surrender tactic” — Greene, Law 22'
  },
  {
    id: 'soup-kitchen-sky',
    title: 'Soup Kitchen Sky',
    artist: 'bZ',
    file: '/audio/Soup_Kitchen_Sky_2.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'star-steam long-way-down night',
    zone: { row: 4, col: 3 },
    wisdom: '“Plan all the way to the end” — Greene, Law 29'
  },
  {
    id: 'promised-land-hands',
    title: 'Different World Tonight',
    artist: 'bZ',
    file: '/audio/Promised_Land_Hands_1.mp3',
    cover: COVERS.canon,
    album: 'canon',
    vibe: 'open-hands neon-sky enough',
    zone: { row: 4, col: 5 },
    wisdom: '“Win through your actions, never through argument” — Greene, Law 9'
  },
  {
    id: 'eisenhower-matrix',
    title: 'Eisenhower Matrix',
    artist: 'bZ',
    file: '/audio/Eisenhower_Matrix.mp3',
    cover: COVERS.c1,
    album: 'appeal',
    vibe: 'resolute-room ten-laws decree',
    zone: { row: 5, col: 0 },
    wisdom: '“Master the art of timing — wait when others rush; strike when others wait” — Greene, Law 35'
  },
  {
    id: 'cbo-pen',
    title: 'CBO Pen',
    artist: 'bZ',
    file: '/audio/CBO_Pen.mp3',
    cover: COVERS.c3,
    album: 'appeal',
    vibe: 'trillion-interest debt-ceiling solo',
    zone: { row: 5, col: 2 },
    wisdom: '“Always say less than necessary — power lies in restraint” — Greene, Law 4'
  },
  {
    id: 'federal-reserve-trash',
    title: 'Federal Reserve Trash',
    artist: 'bZ',
    file: '/audio/Federal_Reserve_Trash.mp3',
    cover: COVERS.c5,
    album: 'appeal',
    vibe: 'fiat-ash hundred-year dust',
    zone: { row: 5, col: 4 },
    wisdom: '“Plan all the way to the end — the end determines the beginning” — Greene, Law 29'
  },
  {
    id: 'millstone-prophecy',
    title: 'Millstone Prophecy',
    artist: 'bZ',
    file: '/audio/Millstone_Prophecy.mp3',
    cover: COVERS.unnamed,
    album: 'appeal',
    vibe: 'millstone Matthew-18 warning',
    zone: { row: 5, col: 7 },
    wisdom: '“Crush your enemy totally — only the predator, never the panda” — Greene, Law 15'
  },
  {
    id: 'mama-called-us',
    title: 'Mama Called Us',
    artist: 'bZ',
    file: '/audio/Mama_Called_Us.mp3',
    cover: COVERS.light,
    album: 'appeal',
    vibe: 'baby-shark nursery-dark mark',
    zone: { row: 6, col: 1 },
    wisdom: '“Win through your actions, never through argument” — Greene, Law 9'
  },
  {
    id: 'soupe-saint-jean',
    title: 'Soupe Saint-Jean',
    artist: 'bZ',
    file: '/audio/Soupe_Saint-Jean.mp3',
    cover: COVERS.canon,
    album: 'appeal',
    vibe: 'Stromae-dance soupe Saint-Jean',
    zone: { row: 6, col: 3 },
    wisdom: '“Make your accomplishments seem effortless — conceal the sweat” — Greene, Law 30'
  },
  {
    id: 'hobbit-kettle-fire',
    title: 'Hobbit Kettle Fire',
    artist: 'bZ',
    file: '/audio/Hobbit_Kettle_Fire.mp3',
    cover: COVERS.c2,
    album: 'hobbit-passover',
    vibe: 'shire-meek empire-topple throne',
    zone: { row: 6, col: 6 },
    wisdom: '“Use absence to increase respect and honor” — Greene, Law 16'
  },
  {
    id: 'pineal-crown',
    title: 'Pineal Crown',
    artist: 'bZ',
    file: '/audio/Pineal_Crown.mp3',
    cover: COVERS.c4,
    album: 'wormhole',
    vibe: 'pioneer-crown built-for-test',
    zone: { row: 4, col: 0 },
    wisdom: '“Make your accomplishments seem effortless” — Greene, Law 30'
  },
  {
    id: 'tide-foley-revelation',
    title: 'Tide Foley Revelation',
    artist: 'bZ',
    file: '/audio/Tide_Foley_Revelation.mp3',
    cover: COVERS.c5,
    album: 'wormhole',
    vibe: 'no-farther leviathan-sea claim',
    zone: { row: 4, col: 1 },
    wisdom: '“Master the art of timing” — Greene, Law 35'
  },
  {
    id: 'bermuda-slipstream',
    title: 'Bermuda Slipstream',
    artist: 'bZ',
    file: '/audio/Bermuda_Slipstream.mp3',
    cover: COVERS.c6,
    album: 'wormhole',
    vibe: 'dawn-duffel chart-edge escape',
    zone: { row: 4, col: 4 },
    wisdom: '“Never appear too perfect — let one flaw show, so envy stays starved” — Greene, Law 46'
  },
  {
    id: 'chimba-precisa',
    title: 'Chimba Precisa',
    artist: 'bZ',
    file: '/audio/Chimba_Precisa.mp3',
    cover: COVERS.c7,
    album: 'wormhole',
    vibe: 'barrio-cambiando paso preciso',
    zone: { row: 4, col: 6 },
    wisdom: '“Pose as a friend, work as a holy spy” — Greene, Law 14 (used kindly)'
  },
  // ── St. John's Halo ──────────────────────────────────────────────
  {
    id: 'st-johns-halo',
    title: 'Only Human',
    artist: 'bZ',
    file: '/audio/St._John_s_Halo_1.mp3',
    cover: COVERS.halo,
    album: 'canon',
    vibe: 'doubt-cape fallen gold ring',
    zone: { row: 7, col: 1 },
    wisdom: '”Concentrate your forces — every prayer in one direction” — Greene, Law 23'
  },
  {
    id: 'soup-kitchen-windows',
    title: 'Come Through',
    artist: 'bZ',
    file: '/audio/Soup_Kitchen_Windows.mp3',
    cover: COVERS.halo,
    album: 'canon',
    vibe: 'window-frame table beyond-meal',
    zone: { row: 7, col: 2 },
    wisdom: '”Win through your actions, never through argument” — Greene, Law 9'
  },
  // ── Wormhole Tape extended ────────────────────────────────────────

  // ── Canopy Dispatch ───────────────────────────────────────────────
  {
    id: 'banyan-ember-light',
    title: 'Banyan Ember Light',
    artist: 'bZ',
    file: '/audio/Banyan_Ember_Light.mp3',
    cover: COVERS.c6,
    album: 'canopy',
    vibe: 'jungle-moon river-smoke psalm',
    zone: { row: 8, col: 0 },
    wisdom: '"Concentrate your forces" — Greene, Law 23'
  },
  {
    id: 'birch-swing-heaven',
    title: 'Touch The Sky',
    artist: 'bZ',
    file: '/audio/Birch_Swing_Heaven.mp3',
    cover: COVERS.light,
    album: 'canopy',
    vibe: 'birch-climb sky-touch refuge',
    zone: { row: 8, col: 1 },
    wisdom: '"Use absence to increase respect and honor" — Greene, Law 16'
  },
  {
    id: 'brick-city-near',
    title: 'Drift Closer',
    artist: 'bZ',
    file: '/audio/Brick_City_Near.mp3',
    cover: COVERS.c5,
    album: 'canopy',
    vibe: 'brick-city soft-kiss proximity',
    zone: { row: 8, col: 2 },
    wisdom: '"Always say less than necessary" — Greene, Law 4'
  },
  {
    id: 'homoousios-stone',
    title: 'One Substance, One Nature',
    artist: 'bZ',
    file: '/audio/Homoousios_Stone.mp3',
    cover: COVERS.c1,
    album: 'canopy',
    vibe: 'Jerusalem-Newark creed-carrying stone',
    zone: { row: 8, col: 3 },
    wisdom: '"Win through your actions, never through argument" — Greene, Law 9'
  },
  {
    id: 'sky-been-knocking',
    title: 'Sky Been Knocking',
    artist: 'bZ',
    file: '/audio/Sky_Been_Knocking.mp3',
    cover: COVERS.alien,
    album: 'canopy',
    vibe: 'sky-knock wake-the-sleepers stars',
    zone: { row: 8, col: 4 },
    wisdom: '"Make your accomplishments seem effortless" — Greene, Law 30'
  },
  {
    id: 'terms-updated',
    title: 'Terms Updated',
    artist: 'bZ',
    file: '/audio/Terms_Updated.mp3',
    cover: COVERS.middle,
    album: 'canopy',
    vibe: 'AI-terms Satan-update alarm',
    zone: { row: 8, col: 5 },
    wisdom: '"Never appear too perfect" — Greene, Law 46'
  },
  {
    id: 'syllabus-sling',
    title: 'Syllabus Sling',
    artist: 'bZ',
    file: '/audio/Syllabus_Sling.mp3',
    cover: COVERS.alien,
    album: 'wormhole',
    vibe: 'slingshot-home study-hall hymn',
    zone: { row: 9, col: 1 },
    wisdom: '"Plan all the way to the end" — Greene, Law 29'
  },
  {
    id: 'border-mercy',
    title: 'Border Mercy',
    artist: 'bZ',
    file: '/audio/Border_Mercy.mp3',
    video: '/media/pub/border-mercy.mp4',
    cover: COVERS.c1,
    album: 'mercy-drop',
    vibe: 'checkpoint paperwork-saint dawn',
    zone: { row: 9, col: 2 },
    wisdom: '"Despise the free lunch" — Greene, Law 40'
  },
  {
    id: 'mercy-border',
    title: 'Mercy Border',
    artist: 'bZ',
    file: '/audio/Mercy_Border.mp3',
    cover: COVERS.c2,
    album: 'mercy-drop',
    vibe: 'mother-at-the-line patient holy',
    zone: { row: 9, col: 3 },
    wisdom: '"Concentrate your forces" — Greene, Law 23'
  },
  {
    id: 'afghanistan-mercy',
    title: 'Afghanistan Mercy',
    artist: 'bZ',
    file: '/audio/Afghanistan_Mercy.mp3',
    cover: COVERS.c3,
    album: 'mercy-drop',
    vibe: 'withdrawal-grace tarmac silence',
    zone: { row: 9, col: 4 },
    wisdom: '"Master the art of timing" — Greene, Law 35'
  },
  {
    id: 'kabul-handheld-prayer',
    title: 'Kabul Handheld Prayer',
    artist: 'bZ',
    file: '/audio/Kabul_Handheld_Prayer.mp3',
    cover: COVERS.c4,
    album: 'mercy-drop',
    vibe: 'phone-light supplication rooftop',
    zone: { row: 9, col: 5 },
    wisdom: '"Use absence to increase respect and honor" — Greene, Law 16'
  },
  {
    id: 'kia-boys-handshake',
    title: 'KIA Boys Handshake',
    artist: 'bZ',
    file: '/audio/KIA_Boys_Handshake.mp3',
    cover: COVERS.c5,
    album: 'mercy-drop',
    vibe: 'fallen-brothers grip eternal',
    zone: { row: 9, col: 6 },
    wisdom: '"Reputation is the cornerstone of power" — Greene, Law 5'
  },
  {
    id: 'chrome-mercy-lift',
    title: 'Chrome Mercy Lift',
    artist: 'bZ',
    file: '/audio/Chrome_Mercy_Lift.mp3',
    cover: COVERS.c6,
    album: 'mercy-drop',
    vibe: 'cyber-ghost elevator grace',
    zone: { row: 10, col: 0 },
    wisdom: '"Re-create yourself" — Greene, Law 25'
  },
  {
    id: 'holy-steel',
    title: 'Holy Steel',
    artist: 'bZ',
    file: '/audio/Holy_Steel.mp3',
    cover: COVERS.c7,
    album: 'mercy-drop',
    vibe: 'armored-saint mass-iron blessed',
    zone: { row: 10, col: 1 },
    wisdom: '"Keep your hands clean" — Greene, Law 26'
  },
  {
    id: 'humble-thunder',
    title: 'Humble Thunder',
    artist: 'bZ',
    file: '/audio/Humble_Thunder.mp3',
    cover: COVERS.unnamed,
    album: 'mercy-drop',
    vibe: 'quiet-strike low-volume awe',
    zone: { row: 10, col: 2 },
    wisdom: '"Always say less than necessary" — Greene, Law 4'
  },
  {
    id: 'humble-still-lit',
    title: 'Humble Still Lit',
    artist: 'bZ',
    file: '/audio/Humble_Still_Lit.mp3',
    cover: COVERS.light,
    album: 'mercy-drop',
    vibe: 'pilot-light always-on devotion',
    zone: { row: 10, col: 3 },
    wisdom: '"Discover each man\'s thumbscrew — refuse this one" — anti-Greene, Law 33'
  },
  {
    id: 'almost-heartbreak',
    title: 'Almost Heartbreak',
    artist: 'bZ',
    file: '/audio/Almost_Heartbreak.mp3',
    cover: COVERS.middle,
    album: 'mercy-drop',
    vibe: 'caught-the-edge mercy reprieve',
    zone: { row: 10, col: 4 },
    wisdom: '"Do not commit to anyone" — Greene, Law 20 (with one exception: the kingdom)'
  },
  {
    id: 'atlantis-crossfire',
    title: 'Atlantis Crossfire',
    artist: 'bZ',
    file: '/audio/Atlantis_Crossfire.mp3',
    cover: COVERS.alien,
    album: 'mercy-drop',
    vibe: 'submerged-kingdom rising tide',
    zone: { row: 10, col: 5 },
    wisdom: '"Make your accomplishments seem effortless" — Greene, Law 30'
  },
  {
    id: 'breathe-out-clean',
    title: 'Breathe Out Clean',
    artist: 'bZ',
    file: '/audio/Breathe_Out_Clean.mp3',
    cover: COVERS.c1,
    album: 'mercy-drop',
    vibe: 'exhale-baptism kitchen window',
    zone: { row: 10, col: 6 },
    wisdom: '"Pose as a friend" — Greene, Law 14'
  },
  {
    id: 'paper-cup-gospel',
    title: 'Paper-Cup Gospel',
    artist: 'bZ',
    file: '/audio/Paper_Cup_Gospel.mp3',
    cover: COVERS.canon,
    album: 'mercy-drop',
    vibe: 'soup-line scripture brown-paper',
    zone: { row: 11, col: 0 },
    wisdom: '"Despise the free lunch" — Greene, Law 40 (encore)'
  },
  {
    id: 'pick-one-star',
    title: 'Pick One Star',
    artist: 'bZ',
    file: '/audio/Pick_One_Star.mp3',
    cover: COVERS.galactic,
    album: 'mercy-drop',
    vibe: 'orient single-point compass',
    zone: { row: 11, col: 1 },
    wisdom: '"Plan all the way to the end" — Greene, Law 29'
  },
  {
    id: 'rimshot-redemption',
    title: 'Rimshot Redemption',
    artist: 'bZ',
    file: '/audio/Rimshot_Redemption.mp3',
    cover: COVERS.dump,
    album: 'mercy-drop',
    vibe: 'drum-machine grace ba-dum-tss',
    zone: { row: 11, col: 2 },
    wisdom: '"Always say less than necessary" — Greene, Law 4 (with a wink)'
  },
  {
    id: 'window-herb-parade',
    title: 'Window Herb Parade',
    artist: 'bZ',
    file: '/audio/Window_Herb_Parade.mp3',
    cover: COVERS.unnamed,
    album: 'mercy-drop',
    vibe: 'basil-sage-mint kitchen marching',
    zone: { row: 11, col: 3 },
    wisdom: '"Re-create yourself" — Greene, Law 25 (in the kitchen)'
  },
  {
    id: 'guadalajara-sin-talla',
    title: 'Guadalajara Sin Talla',
    artist: 'bZ',
    file: '/audio/guadalajara-sin-talla.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: "Latin gospel trap. No size, no limit.",
    zone: { row: 12, col: 2 },
    wisdom: "\"Court attention at all cost\" — Greene, Law 6"
  },
  {
    id: 'loaded-dice',
    title: 'Loaded Dice',
    artist: 'bZ',
    file: '/audio/loaded-dice.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: "Soul-blues rock. The house always wins, except this one.",
    zone: { row: 12, col: 4 },
    wisdom: "\"Concentrate your forces\" — Greene, Law 23"
  },
  {
    id: 'gray-skies-amen',
    title: 'Gray Skies Amen',
    artist: 'bZ',
    file: '/audio/gray-skies-amen.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: "Cinematic prayer rap. Weather as worship.",
    zone: { row: 12, col: 5 },
    wisdom: "\"Plan all the way to the end\" — Greene, Law 29"
  },
  {
    id: 'sleep-like',
    title: 'Sleep Like',
    artist: 'bZ',
    file: '/audio/sleep-like.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: "Uplifting folk-pop. How the saints rest.",
    zone: { row: 12, col: 6 },
    wisdom: "\"Make your accomplishments seem effortless\" — Greene, Law 30"
  },
  {
    id: 'betelgeuse-passover',
    title: 'Betelgeuse Passover',
    artist: 'bZ',
    file: '/audio/betelgeuse-passover.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Uplifting soulful folk-pop anthem with gospel warmth, cinematic drums, acoustic guitar, piano, subtle organ',
    zone: { row: 13, col: 1 },
    wisdom: '"Whatever you did for the least of these, you did for me" — Matthew 25:40'
  },
  {
    id: 'betelgeuse-credit',
    title: 'Betelgeuse Credit',
    artist: 'bZ',
    file: '/audio/betelgeuse-credit.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Absurd cosmic comedy rap anthem',
    zone: { row: 13, col: 2 },
    wisdom: '"Look after orphans and widows in their distress" — James 1:27'
  },
  {
    id: 'atm-mercy',
    title: 'ATM Mercy',
    artist: 'bZ',
    file: '/audio/atm-mercy.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Epic gospel-trap charity anthem',
    zone: { row: 13, col: 3 },
    wisdom: '"Give to the one who asks you" — Matthew 5:42'
  },
  {
    id: 'cardboard-sign-mercy',
    title: 'Cardboard Sign Mercy',
    artist: 'bZ',
    file: '/audio/cardboard-sign-mercy.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Satirical anti war anthem outsider',
    zone: { row: 13, col: 4 },
    wisdom: '"Act justly, love mercy, walk humbly" — Micah 6:8'
  },
  {
    id: 'ash-not-ashes',
    title: 'Ash Not Ashes',
    artist: 'bZ',
    file: '/audio/ash-not-ashes.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Epic gospel trap prayer anthem',
    zone: { row: 13, col: 5 },
    wisdom: '"Though he fall, he shall not be utterly cast down" — Psalm 37:24'
  },
  {
    id: 'temple-prescription',
    title: 'Temple Prescription',
    artist: 'bZ',
    file: '/audio/temple-prescription.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Glossy contemporary pop anthem',
    zone: { row: 13, col: 6 },
    wisdom: '"By his wounds we are healed" — Isaiah 53:5'
  },
  {
    id: 'stairmaster-prayer',
    title: 'StairMaster Prayer',
    artist: 'bZ',
    file: '/audio/stairmaster-prayer.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Epic cinematic workout anthem',
    zone: { row: 14, col: 1 },
    wisdom: '"They that wait upon the Lord shall renew their strength" — Isaiah 40:31'
  },
  {
    id: 'boo-back-mind',
    title: 'Boo Back Mind',
    artist: 'bZ',
    file: '/audio/boo-back-mind.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Haunted psychedelic indie rock anthem',
    zone: { row: 14, col: 3 },
    wisdom: '"Perfect love casts out fear" — 1 John 4:18'
  },
  {
    id: 'danny-s-strike-suit',
    title: 'Danny’s Strike Suit',
    artist: 'bZ',
    file: '/audio/danny-s-strike-suit.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Upbeat pop-rock / country-rock bowling',
    zone: { row: 14, col: 4 },
    wisdom: '"Do it with all your might" — Ecclesiastes 9:10'
  },
  {
    id: 'aire-inhalado',
    title: 'Aire Inhalado',
    artist: 'bZ',
    file: '/audio/aire-inhalado.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Dark Latin urbano protest anthem',
    zone: { row: 14, col: 6 },
    wisdom: '"The light shines in the darkness" — John 1:5'
  },
  {
    id: 'timestamp-jumps',
    title: 'Timestamp Jumps',
    artist: 'bZ',
    file: '/audio/timestamp-jumps.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Glitchy cosmic boom-bap',
    zone: { row: 15, col: 2 },
    wisdom: '"Be strong and courageous" — Joshua 1:9'
  },
  {
    id: 'mercy-steel',
    title: 'Mercy Steel',
    artist: 'bZ',
    file: '/audio/mercy-steel.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Hard cinematic gospel-trap',
    zone: { row: 15, col: 3 },
    wisdom: '"Faith as small as a mustard seed" — Matthew 17:20'
  },
  {
    id: 'stone-number-mercy',
    title: 'Stone-Number Mercy',
    artist: 'bZ',
    file: '/audio/stone-number-mercy.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Stark gospel-trap lament',
    zone: { row: 15, col: 5 },
    wisdom: '"A time to heal, a time to build" — Ecclesiastes 3:3'
  },
  {
    id: '48-hours',
    title: '48 Hours',
    artist: 'bZ',
    file: '/audio/48-hours.mp3',
    cover: '/art/cover-betelgeuse-passover.jpg',
    album: 'betelgeuse-passover',
    vibe: 'Urgent cinematic drill',
    zone: { row: 15, col: 6 },
    wisdom: '"El que es fiel en lo poco" — Lucas 16:10'
  },
  {
    id: 'wexford-bridge',
    title: 'Wexford Bridge',
    artist: 'bZ',
    file: '/audio/wexford-bridge.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: 'Cinematic Irish rebel folk ballad',
    zone: { row: 16, col: 1 },
    wisdom: '"Precious in the sight of the LORD is the death of his faithful servants" — Psalm 116:15'
  },
  {
    id: 'chris-kalwa',
    title: 'Chris Kalwa',
    artist: 'bZ',
    file: '/audio/chris-kalwa.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: 'Pop-rock birthday anthem',
    zone: { row: 16, col: 5 },
    wisdom: '"A friend loves at all times, and a brother is born for adversity" — Proverbs 17:17'
  },
  {
    id: 'bermuda-prophecy',
    title: 'Bermuda Prophecy',
    artist: 'bZ',
    file: '/audio/bermuda-prophecy.mp3',
    video: '/media/bermuda-prophecy.mp4',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: 'Surreal gospel-trap, Bermuda Triangle bus trip',
    zone: { row: 17, col: 0 },
    wisdom: '"Blessed are the pure in heart, for they will see God" — Matthew 5:8'
  },
  {
    id: 'other-side-of-the-fall',
    title: 'Other Side of the Fall',
    artist: 'bZ',
    file: '/audio/other-side-of-the-fall.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: 'Melodic trap soul, black hole cosmology hope',
    zone: { row: 17, col: 4 },
    wisdom: '"I am making everything new" — Revelation 21:5'
  },
  {
    id: 'quarter-in-the-psychic-machine',
    title: 'Quarter in the Psychic Machine',
    artist: 'bZ',
    file: '/audio/quarter-in-the-psychic-machine.mp3',
    cover: '/art/cover-signals.jpg',
    album: 'signals',
    vibe: 'Mystic country trap-folk, tarot courts decoded',
    zone: { row: 17, col: 5 },
    wisdom: '"If any of you lacks wisdom, you should ask God" — James 1:5'
  },
  {
    id: 'algenib-crown-of-the-sky',
    title: 'Algenib, Crown of the Sky',
    artist: 'bZ',
    file: '/audio/algenib-crown-of-the-sky.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'Celestial star-worship epic — Pegasus-shoulder blue-flame gospel, cosmic throne-room praise',
    zone: { row: 18, col: 2 },
    wisdom: '"When all the lesser lights grow dim, we lift our souls" — the stars don\'t compete, they just burn'
  },
  {
    id: 'let-harmony-begin',
    title: 'Let Harmony Begin',
    artist: 'bZ',
    file: '/audio/let-harmony-begin.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'Interstellar peace prayer — quantum choirs, Algenib-star litany, living God addressed across the cosmos',
    zone: { row: 18, col: 3 },
    wisdom: '"No distant star can do what we refuse" — peace isn\'t delivered, it\'s practiced'
  },
  {
    id: 'the-smell-was-so-sinful',
    title: 'The Smell Was So Sinful',
    artist: 'bZ',
    file: '/audio/the-smell-was-so-sinful.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'Dystopian eco-rock — Guadalajara chemical clouds, aliens from 2099 clean up corporate crime while a black-star rockstar sounds the alarm',
    zone: { row: 18, col: 4 },
    wisdom: '"Clean air is a right. Silence has a price." — environmental justice is not someone else\'s job'
  },
  {
    id: 'peace-in-the-picture',
    title: 'Peace in the Picture',
    artist: 'bZ',
    file: '/audio/peace-in-the-picture.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'Soulful anti-war trap manifesto — Marlboro ghosts, Dolores O\'Riordan echoes, global peace from Jerusalem to Gaza to Yemen',
    zone: { row: 18, col: 5 },
    wisdom: '"God may carry the cosmos, but the calling is ours" — peace is built with bread, belief, and relief'
  },
  {
    id: 'highlight-heaven',
    title: 'Highlight Heaven',
    artist: 'bZ',
    file: '/audio/highlight-heaven.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'AI-text-spirituality fusion — highlight a word, transform a world; Algenib and Betelgeuse answer through the interface',
    zone: { row: 19, col: 0 },
    wisdom: '"Highlight impossible — watch it read begin" — words are the first act of creation'
  },
  {
    id: 'hobbit-passover',
    title: 'Hobbit Passover',
    artist: 'bZ',
    file: '/audio/hobbit-passover.mp3',
    cover: '/art/cover-hobbit-passover.jpg',
    album: 'hobbit-passover',
    vibe: 'Title-track humanitarian epic — seder-table wisdom becomes global rescue mission, organized mercy with matzah and marching orders',
    zone: { row: 19, col: 1 },
    wisdom: '"Knowledge without kindness is a crown made of fear" — the Salon taught questions, the questions became marching orders'
  }
,
  {
    id: 'i-killed-your-dragon',
    title: 'I Killed Your Dragon',
    artist: 'bZ',
    file: '/audio/i-killed-your-dragon.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Cinematic fantasy trap — walking through wildfire, dragon-slaying as self-rescue, the damsel saves herself',
    zone: { row: 20, col: 1 },
    wisdom: '"I killed your dragon — now what?" — the real quest begins after the monster falls'
  },
  {
    id: 'which-bank-we-robbin',
    title: 'Which Bank We Robbin\'',
    artist: 'bZ',
    file: '/audio/which-bank-we-robbin.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Milwaukee street-gospel heist fantasy — Aunt Cindi\'s blessing, moonlit schemes, Robin Hood with a prayer',
    zone: { row: 20, col: 2 },
    wisdom: '"Milwaukee moon, music moving through the mist" — every heist needs a hymn'
  },
  {
    id: 'seven-eleven-heaven',
    title: 'Seven-Eleven Heaven',
    artist: 'bZ',
    file: '/audio/seven-eleven-heaven.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Birthday double-anthem for Laura and Mike — convenience-store cosmic gratitude, Slurpee spirituality',
    zone: { row: 20, col: 3 },
    wisdom: '"Seven-eleven, make a wish" — heaven hides in the everyday checkout line'
  },
  {
    id: 'ocular-uplink',
    title: 'Ocular Uplink',
    artist: 'bZ',
    file: '/audio/ocular-uplink.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Cyberpunk gospel — blink-activated signal, neural interface with the divine, seeing through the static',
    zone: { row: 20, col: 4 },
    wisdom: '"Blink once — signal in the static" — the connection was always there, you just needed the uplink'
  },
  {
    id: 'the-soul-key',
    title: 'The Soul Key',
    artist: 'bZ',
    file: '/audio/the-soul-key.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Lo-fi spiritual discovery — found in the dirt by an old stone wall, the key that unlocks what was always yours',
    zone: { row: 20, col: 5 },
    wisdom: '"Found it in the dirt by the old stone wall" — the most valuable things hide in plain sight'
  },
  {
    id: 'banana-peel-philosophy',
    title: 'Banana Peel Philosophy',
    artist: 'bZ',
    file: '/audio/banana-peel-philosophy.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Folk-rap garden wisdom — sister\'s compost theology, how banana peels teach resurrection, small acts grow revolutions',
    zone: { row: 21, col: 0 },
    wisdom: '"My sister saves her banana peels" — the compost pile is the first draft of the resurrection'
  },
  {
    id: 'flawless-execution',
    title: 'Flawless Execution',
    artist: 'bZ',
    file: '/audio/flawless-execution.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Title-track precision manifesto — breathe in purpose, exhale doubt, every move calculated, every outcome inevitable',
    zone: { row: 21, col: 1 },
    wisdom: '"I breathe in purpose, breathe out doubt" — execution isn\'t luck, it\'s architecture'
  },
  {
    id: 'the-night-knew-my-name',
    title: 'The Night Knew My Name',
    artist: 'bZ',
    file: '/audio/the-night-knew-my-name.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Space-race cinematic epic — they called it impossible, the night called back, proving the doubters wrong in real time',
    zone: { row: 21, col: 2 },
    wisdom: '"They called it space — I called it impossible" — then the night answered and the impossible became the launchpad'
  },
  {
    id: 'crown-without-a-sound',
    title: 'Crown Without a Sound',
    artist: 'bZ',
    file: '/audio/crown-without-a-sound.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Silent-power R&B trap — soft steps, sharp sight, the whole room turns without a word spoken, quiet authority',
    zone: { row: 21, col: 3 },
    wisdom: '"Soft steps, sharp sight — I arrive in the night" — real power doesn\'t announce itself'
  },
  {
    id: 'believe-it-when-you-see-it',
    title: 'Believe It When You See It',
    artist: 'bZ',
    file: '/audio/believe-it-when-you-see-it.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Skeptic\'s gospel — show me the proof, then I\'ll build the church, seeing is believing but believing changes what you see',
    zone: { row: 21, col: 4 },
    wisdom: '"Believe it when you see it" — and sometimes seeing starts with believing first'
  },
  {
    id: 'creepy-as-hell',
    title: 'Creepy as Hell',
    artist: 'bZ',
    file: '/audio/creepy-as-hell.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Nostalgia-horror MUD-core — fourteen years old in the monitor glow, text-based worlds that felt too real, the internet before it was tame',
    zone: { row: 21, col: 5 },
    wisdom: '"I was fourteen years old in the monitor glow" — the creepiest things are the ones that shaped you'
  },
  {
    id: 'come-fix-the-world',
    title: 'Come Fix the World',
    artist: 'bZ',
    file: '/audio/come-fix-the-world.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Celebrity-callout protest anthem — all that fame and fortune, what did you do with it? The world is broken and the fixers are needed',
    zone: { row: 22, col: 0 },
    wisdom: '"All that fame, all that fortune, all those flashing lights" — what are you doing with your platform?'
  },
  {
    id: 'coincidence-overload',
    title: 'Coincidence Overload',
    artist: 'bZ',
    file: '/audio/coincidence-overload.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Synchronicity-spotting rap — another plate, another phrase, another perfectly placed sign, the universe is winking and you\'re finally paying attention',
    zone: { row: 22, col: 1 },
    wisdom: '"Another plate, another phrase, another perfectly placed sign" — coincidence is God\'s way of staying anonymous'
  },
  {
    id: 'the-least-pay-the-most',
    title: 'The Least Pay the Most',
    artist: 'bZ',
    file: '/audio/the-least-pay-the-most.mp3',
    cover: '/art/cover-flawless-execution.jpg',
    album: 'flawless-execution',
    vibe: 'Economic justice drill — the broke pay more while the wealthy build gold-trimmed churches, the math of oppression laid bare',
    zone: { row: 22, col: 2 },
    wisdom: '"They built a brutal business where the broke pay more" — the poverty tax is the steepest tax of all'
  }
,
  {
    id: 'the-odds-don-t-know-me',
    title: 'The Odds Don\'t Know Me',
    artist: 'bZ',
    file: '/audio/the-odds-don-t-know-me.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Solo-piano defiance ballad — the underdog who beats every calculation, odds are math and math doesn\'t know your name',
    zone: { row: 23, col: 0 },
    wisdom: '"They counted every reason I should never reach the sky" — the odds never met you'
  },
  {
    id: 'two-friends-two-hunnies',
    title: 'Two Friends, Two Hunnies',
    artist: 'bZ',
    file: '/audio/two-friends-two-hunnies.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Festival-EDM mashup-pop anthem — eerie synths snap into huge drops; two buddies in, two hunnies out, everything came in twos',
    zone: { row: 23, col: 1 },
    wisdom: '"Two friends with me" — count the people, not the problems'
  },
  {
    id: 'jehovian-wisdom',
    title: 'Jehovian Wisdom',
    artist: 'bZ',
    file: '/audio/jehovian-wisdom.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Soft-piano spiritual meditation — quiet in the chaos, ancient wisdom through a modern storm, calm as doctrine',
    zone: { row: 23, col: 2 },
    wisdom: '"Quiet in the chaos, calm in the crowd" — wisdom is stillness with a spine'
  },
  {
    id: 'the-halo-and-the-horror',
    title: 'The Halo and the Horror',
    artist: 'bZ',
    file: '/audio/the-halo-and-the-horror.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Sacred-piano duality hymn — every halo casts a shadow, mercy and terror in the same light, holding both at once',
    zone: { row: 23, col: 3 },
    wisdom: '"No halo without mercy" — the horror and the holy share one light'
  },
  {
    id: 'you-almost-had-me',
    title: 'You Almost Had Me',
    artist: 'bZ',
    file: '/audio/you-almost-had-me.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Pop-confrontation comeback — the moment you almost lost and didn\'t, teeth-gritted refusal set to a hook',
    zone: { row: 23, col: 4 },
    wisdom: '"There you go again..." — almost is the closest failure gets'
  },
  {
    id: 'welcome-to-the-multiverse',
    title: 'Welcome to the Multiverse',
    artist: 'bZ',
    file: '/audio/welcome-to-the-multiverse.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Title-track cosmic-welcome epic — bare piano into a fracture of worlds, every version of you is invited',
    zone: { row: 23, col: 5 },
    wisdom: '"They found the fracture" — every timeline is a door, walk through it'
  },
  {
    id: 'the-last-soldier-refused',
    title: 'The Last Soldier Refused',
    artist: 'bZ',
    file: '/audio/the-last-soldier-refused.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Female-vocal anti-war requiem — the last soldier drops the rifle, the war ends where refusal begins',
    zone: { row: 24, col: 0 },
    wisdom: '"One hand shook, one rifle fell" — the bravest order is the one disobeyed'
  },
  {
    id: 'myla-shine-on',
    title: 'Myla, Shine On',
    artist: 'bZ',
    file: '/audio/myla-shine-on.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Warm dedication lullaby — a name turned into light, soft piano blessing for someone who glows',
    zone: { row: 24, col: 1 },
    wisdom: '"Myla, shine on" — some names are prayers'
  },
  {
    id: 'if-we-met-again',
    title: 'If We Met Again',
    artist: 'bZ',
    file: '/audio/if-we-met-again.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Memory-wash love ballad — if the world erased us, would we find each other twice? Piano-led second-chance romance',
    zone: { row: 24, col: 2 },
    wisdom: '"If the whole world washed my memory clean" — real love survives the reset'
  },
  {
    id: 'grace-under-pressure',
    title: 'Grace Under Pressure',
    artist: 'bZ',
    file: '/audio/grace-under-pressure.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Sparse-piano gospel interrogation — when heaven feels like martial law, grace is the pressure that makes diamonds',
    zone: { row: 24, col: 3 },
    wisdom: '"If Heaven\'s holy, why it feel like martial law?" — grace is what remains when the pressure peaks'
  },
  {
    id: 'hate-dies-here',
    title: 'Hate Dies Here',
    artist: 'bZ',
    file: '/audio/hate-dies-here.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Gospel-protest purge anthem — a house rule carved over the door, hate checks its weapons at the threshold',
    zone: { row: 24, col: 4 },
    wisdom: '"Hate dies here" — post it on the door and mean it'
  },
  {
    id: 'become-the-person-you-needed',
    title: 'Become the Person You Needed',
    artist: 'bZ',
    file: '/audio/become-the-person-you-needed.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Healing-timeline promise — the adult you become is the answer to the child who asked the dark why',
    zone: { row: 24, col: 5 },
    wisdom: '"I used to ask the dark, \'Why\'d you pick me?\'" — then become the answer'
  },
  {
    id: 'victory-with-nobody-dead',
    title: 'Victory With Nobody Dead',
    artist: 'bZ',
    file: '/audio/victory-with-nobody-dead.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Piano-choir peace-march — the bravest battle ends with everyone alive, winning the war by winning without war',
    zone: { row: 25, col: 0 },
    wisdom: '"What if the bravest battle" — victory with nobody dead is the highest score'
  },
  {
    id: 'rich-before-the-money',
    title: 'Rich Before the Money',
    artist: 'bZ',
    file: '/audio/rich-before-the-money.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Pre-fame wealth testimony — rich in the rooms before the brands came, the fortune that preceded the check',
    zone: { row: 25, col: 1 },
    wisdom: '"Before the bands, before the brand" — wealth starts where money can\'t reach'
  },
  {
    id: 'the-gates-were-never-locked',
    title: 'The Gates Were Never Locked',
    artist: 'bZ',
    file: '/audio/the-gates-were-never-locked.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Liberation revelation — the wall was smoke, the gates were open the whole time, piano-crescendo freedom',
    zone: { row: 25, col: 2 },
    wisdom: '"I wore the weight of a wall that was smoke" — the gate was never locked'
  },
  {
    id: 'future-me-came-back',
    title: 'Future Me Came Back',
    artist: 'bZ',
    file: '/audio/future-me-came-back.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Time-loop testimony epic — future self returns with the receipt, tape-hiss piano through a 6-minute reveal',
    zone: { row: 25, col: 3 },
    wisdom: '"PRESENT:" — the future came back to say you make it'
  },
  {
    id: 'the-inner-control-room',
    title: 'The Inner Control Room',
    artist: 'bZ',
    file: '/audio/the-inner-control-room.mp3',
    cover: '/art/cover-welcome-to-the-multiverse.jpg',
    album: 'welcome-to-the-multiverse',
    vibe: 'Guided-meditation closer — close your eyes, take a slow breath in, the cockpit of the soul at 7:45',
    zone: { row: 25, col: 4 },
    wisdom: '"Close your eyes. Take a slow breath in." — the control room was inside all along'
  }
,
  {
    id: 'reckless-grace',
    title: 'Reckless Grace',
    artist: 'bZ',
    file: '/audio/reckless-grace.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Gospel-trap title cut — grace that outruns the sin',
    zone: { row: 26, col: 0 },
    wisdom: '"Where sin increased, grace abounded all the more." — Romans 5:20'
  },
  {
    id: 'nobody-beneath-us',
    title: 'Nobody Beneath Us',
    artist: 'bZ',
    file: '/audio/nobody-beneath-us.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic dignity anthem — nobody below the line',
    zone: { row: 26, col: 2 },
    wisdom: '"Whatever you did for the least of these, you did for me." — Matthew 25:40'
  },
  {
    id: 'luminous-love',
    title: 'Luminous Love',
    artist: 'bZ',
    file: '/audio/luminous-love.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Light-drenched worship trap',
    zone: { row: 26, col: 3 },
    wisdom: '"Let your light shine before others." — Matthew 5:16'
  },
  {
    id: 'love-louder',
    title: 'Love Louder',
    artist: 'bZ',
    file: '/audio/love-louder.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Turn mercy up past the red',
    zone: { row: 26, col: 4 },
    wisdom: '"Above all, love each other deeply." — 1 Peter 4:8'
  },
  {
    id: '589-percent',
    title: '589%',
    artist: 'bZ',
    file: '/audio/589-percent.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Overflow math — blessing past the return',
    zone: { row: 27, col: 1 },
    wisdom: '"Pressed down, shaken together, running over." — Luke 6:38'
  },
  {
    id: 'upgrade-the-game',
    title: 'Upgrade the Game',
    artist: 'bZ',
    file: '/audio/upgrade-the-game.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic renewed-mind flex',
    zone: { row: 27, col: 2 },
    wisdom: '"Be transformed by the renewing of your mind." — Romans 12:2'
  },
  {
    id: 'wise-mind-wins',
    title: 'Wise Mind Wins',
    artist: 'bZ',
    file: '/audio/wise-mind-wins.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Drum-and-bass clarity over impulse',
    zone: { row: 27, col: 3 },
    wisdom: '"The beginning of wisdom is this: get wisdom." — Proverbs 4:7'
  },
  {
    id: 'same-moon-different-city',
    title: 'Same Moon, Different City',
    artist: 'bZ',
    file: '/audio/same-moon-different-city.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Soulful piano ballad — one sky, two cities',
    zone: { row: 28, col: 0 },
    wisdom: '"The same Lord is Lord of all." — Romans 10:12'
  },
  {
    id: 'let-the-spark-find-you',
    title: 'Let the Spark Find You',
    artist: 'bZ',
    file: '/audio/let-the-spark-find-you.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Stay ready — the fire finds the willing',
    zone: { row: 28, col: 1 },
    wisdom: '"Fan into flame the gift of God." — 2 Timothy 1:6'
  },
  {
    id: 'building-a-life-worth-staying',
    title: 'Building a Life Worth Staying',
    artist: 'bZ',
    file: '/audio/building-a-life-worth-staying.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Trap-pop — reasons to stay, brick by brick',
    zone: { row: 28, col: 2 },
    wisdom: '"Unless the Lord builds the house, the builders labor in vain." — Psalm 127:1'
  },
  {
    id: 'we-dont-need-another-martyr',
    title: 'We Don’t Need Another Martyr',
    artist: 'bZ',
    file: '/audio/we-dont-need-another-martyr.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic — stay alive, be the testimony',
    zone: { row: 28, col: 3 },
    wisdom: '"I have come that they may have life, and have it to the full." — John 10:10'
  },
  {
    id: 'power-wash-the-capitol',
    title: 'Power Wash the Capitol',
    artist: 'bZ',
    file: '/audio/power-wash-the-capitol.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Protest-trap — righteous pressure on the powers',
    zone: { row: 28, col: 4 },
    wisdom: '"Let justice roll on like a river." — Amos 5:24'
  },
  {
    id: 'peace-after-song',
    title: 'Peace After Song',
    artist: 'bZ',
    file: '/audio/peace-after-song.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'The stillness when the beat fades — album closer',
    zone: { row: 29, col: 0 },
    wisdom: '"Peace I leave with you; my peace I give you." — John 14:27'
  },
  {
    id: 'wake-up-betelgeuse-mix',
    title: 'Wake Up For You (Betelgeuse Mix)',
    artist: 'bZ',
    file: '/audio/wake-up-betelgeuse-mix.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic gospel-trap reveille — Betelgeuse mix',
    zone: { row: 29, col: 1 },
    wisdom: '"Wake up, sleeper, rise from the dead, and Christ will shine on you." — Ephesians 5:14'
  },
  {
    id: 'wake-up-algenib-mix',
    title: 'Wake Up For You (Algenib Mix)',
    artist: 'bZ',
    file: '/audio/wake-up-algenib-mix.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic gospel-trap reveille — Algenib mix',
    zone: { row: 29, col: 2 },
    wisdom: '"Wake up, sleeper, rise from the dead, and Christ will shine on you." — Ephesians 5:14'
  },
  {
    id: 'wake-up-polaris-mix',
    title: 'Wake Up For You (Polaris Mix)',
    artist: 'bZ',
    file: '/audio/wake-up-polaris-mix.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic gospel-trap reveille — Polaris mix',
    zone: { row: 29, col: 3 },
    wisdom: '"Wake up, sleeper, rise from the dead, and Christ will shine on you." — Ephesians 5:14'
  },
  {
    id: 'wake-up-deneb-mix',
    title: 'Wake Up For You (Deneb Mix)',
    artist: 'bZ',
    file: '/audio/wake-up-deneb-mix.mp3',
    cover: '/art/cover-reckless-grace.jpg',
    album: 'reckless-grace',
    vibe: 'Cinematic gospel-trap reveille — Deneb mix',
    zone: { row: 29, col: 4 },
    wisdom: '"Wake up, sleeper, rise from the dead, and Christ will shine on you." — Ephesians 5:14'
  },
  {
    id: 'wake-up-alice',
    title: 'Wake Up, Alice',
    artist: 'bZ',
    file: '/audio/wake-up-alice.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'whispered wonderland reveille',
    zone: { row: 30, col: 0 },
    wisdom: '“Wake, O sleeper, and Christ will shine on you.” — Ephesians 5:14'
  },
  {
    id: 'the-rabbit-is-only-a-rabbit',
    title: 'The Rabbit Is Only A Rabbit',
    artist: 'bZ',
    file: '/audio/the-rabbit-is-only-a-rabbit.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'white-ward dark-pop ballad',
    zone: { row: 30, col: 1 },
    wisdom: '“You’re entirely bonkers. But all the best people are.” — Lewis Carroll'
  },
  {
    id: 'the-rabbit-ward-mix',
    title: 'The Rabbit Is Only A Rabbit (Ward Mix)',
    artist: 'bZ',
    file: '/audio/the-rabbit-ward-mix.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'music-box ward reprise',
    zone: { row: 30, col: 2 },
    wisdom: '“Sometimes I’ve believed as many as six impossible things before breakfast.” — Lewis Carroll'
  },
  {
    id: 'the-rabbit-looking-glass-mix',
    title: 'The Rabbit Is Only A Rabbit (Looking-Glass Mix)',
    artist: 'bZ',
    file: '/audio/the-rabbit-looking-glass-mix.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'cello-haunted looking-glass take',
    zone: { row: 30, col: 3 },
    wisdom: '“If you don’t know where you’re going, any road will take you there.” — Lewis Carroll'
  },
  {
    id: 'the-possessed-class',
    title: 'The Possessed Class',
    artist: 'bZ',
    file: '/audio/the-possessed-class.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'paranoid trap-soul catechism',
    zone: { row: 30, col: 4 },
    wisdom: '“Perfect love casts out fear.” — 1 John 4:18'
  },
  {
    id: 'control-room-in-your-mind',
    title: 'Control Room In Your Mind',
    artist: 'bZ',
    file: '/audio/control-room-in-your-mind.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'child-whisper control-room trap',
    zone: { row: 30, col: 5 },
    wisdom: '“You have power over your mind — not outside events.” — Marcus Aurelius'
  },
  {
    id: 'the-alien-me-show',
    title: 'The Alien Me Show',
    artist: 'bZ',
    file: '/audio/the-alien-me-show.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'surveilled-identity orchestral trap',
    zone: { row: 30, col: 6 },
    wisdom: '“Be yourself; everyone else is already taken.” — Oscar Wilde'
  },
  {
    id: 'the-7-11-prophecy',
    title: 'The 7/11 Prophecy',
    artist: 'bZ',
    file: '/audio/the-7-11-prophecy.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'alliterative gospel-prophecy piano',
    zone: { row: 30, col: 7 },
    wisdom: '“Where there is no vision, the people perish.” — Proverbs 29:18'
  },
  {
    id: 'above-the-grays',
    title: 'Above The Grays',
    artist: 'bZ',
    file: '/audio/above-the-grays.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'new-world-order gospel-trap memoir',
    zone: { row: 31, col: 0 },
    wisdom: '“The truth will set you free.” — John 8:32'
  },
  {
    id: 'above-the-grays-nightfall',
    title: 'Above The Grays (Nightfall Mix)',
    artist: 'bZ',
    file: '/audio/above-the-grays-nightfall.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'orchestral-trap extended dusk',
    zone: { row: 31, col: 1 },
    wisdom: '“The light shines in the darkness, and the darkness has not overcome it.” — John 1:5'
  },
  {
    id: 'last-call-at-the-hub',
    title: 'Last Call at the Hub',
    artist: 'bZ',
    file: '/audio/last-call-at-the-hub.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'cosmic-noir departures lounge',
    zone: { row: 31, col: 2 },
    wisdom: '“Two roads diverged in a wood, and I took the one less traveled by.” — Robert Frost'
  },
  {
    id: 'last-call-at-the-hub-late',
    title: 'Last Call at the Hub (Late Mix)',
    artist: 'bZ',
    file: '/audio/last-call-at-the-hub-late.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'after-hours black-glass jazz',
    zone: { row: 31, col: 3 },
    wisdom: '“The cave you fear to enter holds the treasure you seek.” — Joseph Campbell'
  },
  {
    id: 'find-me-on-algenib',
    title: 'Find Me on Algenib',
    artist: 'bZ',
    file: '/audio/find-me-on-algenib.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'star-refuge club anthem',
    zone: { row: 31, col: 4 },
    wisdom: '“When I consider your heavens… what is man that you are mindful of him?” — Psalm 8:3-4'
  },
  {
    id: 'dont-let-the-future-call-us',
    title: 'Don\'t Let the Future Call Us',
    artist: 'bZ',
    file: '/audio/dont-let-the-future-call-us.mp3',
    cover: COVERS.alice,
    album: 'wake-up-alice',
    vibe: 'alliterative anti-war indictment',
    zone: { row: 31, col: 5 },
    wisdom: '“Blessed are the peacemakers, for they shall be called children of God.” — Matthew 5:9'
  },
  {
    id: 'facts-before-fear',
    title: 'Facts Before Fear',
    artist: 'bZ',
    file: '/audio/facts-before-fear.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'cbt cinematic soul-hop',
    zone: { row: 31, col: 6 },
    wisdom: '“We suffer more in imagination than in reality.” — Seneca'
  },
  {
    id: 'clear-mind-kind-heart',
    title: 'Clear Mind, Kind Heart',
    artist: 'bZ',
    file: '/audio/clear-mind-kind-heart.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'grounding piano-soul',
    zone: { row: 31, col: 7 },
    wisdom: '“Watch over your heart with all diligence, for from it flow the springs of life.” — Proverbs 4:23'
  },
  {
    id: 'peace-is-a-practice',
    title: 'Peace Is A Practice',
    artist: 'bZ',
    file: '/audio/peace-is-a-practice.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'tropical-house breathwork',
    zone: { row: 32, col: 0 },
    wisdom: '“You will keep in perfect peace those whose minds are steadfast.” — Isaiah 26:3'
  },
  {
    id: 'one-breath-one-step',
    title: 'One Breath, One Step',
    artist: 'bZ',
    file: '/audio/one-breath-one-step.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'ready-to-begin piano-pop',
    zone: { row: 32, col: 1 },
    wisdom: '“The journey of a thousand miles begins with a single step.” — Lao Tzu'
  },
  {
    id: 'one-at-a-time',
    title: 'One at a Time',
    artist: 'bZ',
    file: '/audio/one-at-a-time.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'pharmacy-line gospel-pop',
    zone: { row: 32, col: 2 },
    wisdom: '“Do the next right thing.” — recovery proverb'
  },
  {
    id: 'one-small-move',
    title: 'One Small Move',
    artist: 'bZ',
    file: '/audio/one-small-move.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'mountain-in-the-mind soul',
    zone: { row: 32, col: 3 },
    wisdom: '“Little by little, one walks far.” — Peruvian proverb'
  },
  {
    id: 'pause',
    title: 'Pause',
    artist: 'bZ',
    file: '/audio/pause.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'ambient be-still meditation',
    zone: { row: 32, col: 4 },
    wisdom: '“Between stimulus and response there is a space, and in that space is our freedom.” — Viktor Frankl'
  },
  {
    id: 'right-here-right-now',
    title: 'Right Here, Right Now',
    artist: 'bZ',
    file: '/audio/right-here-right-now.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'present-tense trap-pop',
    zone: { row: 32, col: 5 },
    wisdom: '“This is the day the Lord has made; let us rejoice and be glad in it.” — Psalm 118:24'
  },
  {
    id: 'no-vacancy',
    title: 'No Vacancy',
    artist: 'bZ',
    file: '/audio/no-vacancy.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'boundary-setting melodic edm',
    zone: { row: 32, col: 6 },
    wisdom: '“No is a complete sentence.” — Anne Lamott'
  },
  {
    id: 'count-me-out-count-again',
    title: 'Count Me Out, Count Again',
    artist: 'bZ',
    file: '/audio/count-me-out-count-again.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'cinematic comeback chant',
    zone: { row: 32, col: 7 },
    wisdom: '“The righteous fall seven times and rise again.” — Proverbs 24:16'
  },
  {
    id: 'happy-anyway',
    title: 'Happy Anyway',
    artist: 'bZ',
    file: '/audio/happy-anyway.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'dancing-when-it-breaks trap-soul',
    zone: { row: 33, col: 0 },
    wisdom: '“Weeping may stay for the night, but joy comes in the morning.” — Psalm 30:5'
  },
  {
    id: 'one-wish-left',
    title: 'One Wish Left',
    artist: 'bZ',
    file: '/audio/one-wish-left.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'meteor-wish duet',
    zone: { row: 33, col: 1 },
    wisdom: '“Bear one another’s burdens.” — Galatians 6:2'
  },
  {
    id: 'the-last-word',
    title: 'The Last Word',
    artist: 'bZ',
    file: '/audio/the-last-word.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'one-word trip-hop spark',
    zone: { row: 33, col: 2 },
    wisdom: '“Death and life are in the power of the tongue.” — Proverbs 18:21'
  },
  {
    id: 'the-way-you-saw-the-world',
    title: 'The Way You Saw the World',
    artist: 'bZ',
    file: '/audio/the-way-you-saw-the-world.mp3',
    cover: COVERS.pause,
    album: 'the-pause',
    vibe: 'attic-telescope cinematic ballad',
    zone: { row: 33, col: 3 },
    wisdom: '“The world is full of magic things, patiently waiting for our senses to grow sharper.” — W.B. Yeats'
  },
  {
    id: 'god-pointed-at-the-poor',
    title: 'God Pointed at the Poor',
    artist: 'bZ',
    file: '/audio/god-pointed-at-the-poor.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'judgment-day gospel-trap',
    zone: { row: 33, col: 4 },
    wisdom: '“Whatever you did for the least of these, you did for me.” — Matthew 25:40'
  },
  {
    id: 'ambrosia-leavened-bread',
    title: 'Ambrosia Leavened Bread',
    artist: 'bZ',
    file: '/audio/ambrosia-leavened-bread.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'manic gospel-trap communion',
    zone: { row: 33, col: 5 },
    wisdom: '“I am the bread of life.” — John 6:35'
  },
  {
    id: 'meet-me-by-the-mercy-tree',
    title: 'Meet Me By The Mercy Tree',
    artist: 'bZ',
    file: '/audio/meet-me-by-the-mercy-tree.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'red-moon indie-trap vow',
    zone: { row: 33, col: 6 },
    wisdom: '“Mercy triumphs over judgment.” — James 2:13'
  },
  {
    id: 'mercy-tree-gray-mix',
    title: 'Mercy Tree (Gray Mix)',
    artist: 'bZ',
    file: '/audio/mercy-tree-gray-mix.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'instrumental gray-mix elegy',
    zone: { row: 33, col: 7 },
    wisdom: '“Be still, and know that I am God.” — Psalm 46:10'
  },
  {
    id: 'this-little-light-of-mine',
    title: 'This Little Light of Mine',
    artist: 'bZ',
    file: '/audio/this-little-light-of-mine.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'infinite-blessings gospel anthem',
    zone: { row: 34, col: 0 },
    wisdom: '“Let your light shine before others.” — Matthew 5:16'
  },
  {
    id: 'stars-dont-need-permission',
    title: 'Stars Don\'t Need Permission',
    artist: 'bZ',
    file: '/audio/stars-dont-need-permission.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'permission-to-shine piano-pop',
    zone: { row: 34, col: 1 },
    wisdom: '“Let them shine like stars in the sky.” — Philippians 2:15'
  },
  {
    id: 'a-hundred-books-one-life',
    title: 'A Hundred Books, One Life',
    artist: 'bZ',
    file: '/audio/a-hundred-books-one-life.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'quixote soul-pop',
    zone: { row: 34, col: 2 },
    wisdom: '“It is more blessed to give than to receive.” — Acts 20:35'
  },
  {
    id: 'a-hundred-books-longform',
    title: 'A Hundred Books, One Life (Longform Mix)',
    artist: 'bZ',
    file: '/audio/a-hundred-books-longform.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'extended gospel-soul reprise',
    zone: { row: 34, col: 3 },
    wisdom: '“A man’s life does not consist in the abundance of his possessions.” — Luke 12:15'
  },
  {
    id: 'a-little-for-me',
    title: 'A Little for Me',
    artist: 'bZ',
    file: '/audio/a-little-for-me.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'lantern-not-lightning piano-soul',
    zone: { row: 34, col: 4 },
    wisdom: '“Come to me, all who are weary, and I will give you rest.” — Matthew 11:28'
  },
  {
    id: 'little-lanterns',
    title: 'Little Lanterns',
    artist: 'bZ',
    file: '/audio/little-lanterns.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'alliterative lullaby r&b',
    zone: { row: 34, col: 5 },
    wisdom: '“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105'
  },
  {
    id: 'paper-planes-to-paradise',
    title: 'Paper Planes to Paradise',
    artist: 'bZ',
    file: '/audio/paper-planes-to-paradise.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'crumpled-wish cinematic pop',
    zone: { row: 34, col: 6 },
    wisdom: '“Hope is the thing with feathers.” — Emily Dickinson'
  },
  {
    id: 'sidewalk-picasso',
    title: 'Sidewalk Picasso',
    artist: 'bZ',
    file: '/audio/sidewalk-picasso.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'skating chalk-art pop-rock',
    zone: { row: 34, col: 7 },
    wisdom: '“Every child is an artist.” — Pablo Picasso'
  },
  {
    id: 'watch-the-stars-come-out',
    title: 'Watch the Stars Come Out',
    artist: 'bZ',
    file: '/audio/watch-the-stars-come-out.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'kindness-ripple pop-edm',
    zone: { row: 35, col: 0 },
    wisdom: '“No act of kindness, no matter how small, is ever wasted.” — Aesop'
  },
  {
    id: 'fourteen-fins',
    title: 'Fourteen Fins',
    artist: 'bZ',
    file: '/audio/fourteen-fins.mp3',
    cover: COVERS.lanterns,
    album: 'little-lanterns',
    vibe: 'shark-pool patience gospel-pop',
    zone: { row: 35, col: 1 },
    wisdom: '“In quietness and trust is your strength.” — Isaiah 30:15'
  }
];

export const TRACK_BY_ID = new Map<string, Track>(TRACKS.map(t => [t.id, t]));
export const ALBUM_BY_ID = new Map<string, Album>(ALBUMS.map(a => [a.id, a]));

export function tracksForAlbum(albumId: string): Track[] {
  const album = ALBUM_BY_ID.get(albumId);
  if (!album) return [];
  return album.trackIds.map(id => TRACK_BY_ID.get(id)).filter((t): t is Track => Boolean(t));
}

// Spotify artist ID for bZ (resolved 2026-05-29 via track metadata).
// Drives the Follow CTA, the rich-card embeds, and the artist-stats poller.
export const SPOTIFY_ARTIST_ID = '0hDEUhE0QAh51cM1Fe2p3T';
export const SPOTIFY_ARTIST_URL = `https://open.spotify.com/artist/${SPOTIFY_ARTIST_ID}`;

// Next release date — drives the release-prep checklist banner. Set
// when planning a drop; banner fires from 14 days out through release.
// Format: ISO 8601 YYYY-MM-DD. Leave undefined when nothing's queued.
export const NEXT_RELEASE: { title: string; date: string; preSaveUrl?: string } | undefined = undefined;

// PKCE OAuth client for "Pair Spotify Connect". Register at https://developer.spotify.com/dashboard
// with redirect URI https://bz.rocks/spotify/callback. Leave empty to render the
// "coming soon" pairing surface (still wired, just won't initiate OAuth until set).
export const SPOTIFY_CLIENT_ID = '';
export const SPOTIFY_REDIRECT_URI = 'https://bz.rocks/spotify/callback';

export const ROBERT_GREENE_WISDOM = [
  'Make other people come to you — use bait if necessary. — Law 8',
  'Conceal your intentions. Keep the panda flag up; keep the strategy quiet. — Law 3',
  'Reputation is the cornerstone of power. Polish it daily. — Law 5',
  'Plan all the way to the end. The end determines the beginning. — Law 29',
  'Master the art of timing. Wait when others rush; strike when others wait. — Law 35',
  'Re-create yourself. Forge a new identity, command a new role. — Law 25',
  'Make your accomplishments seem effortless. Conceal the sweat. — Law 30',
  'Always say less than necessary. Power lies in restraint. — Law 4',
  'Win through your actions, never through argument. — Law 9',
  'Never appear too perfect — let one flaw show, so envy stays starved. — Law 46'
];
