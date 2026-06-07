/**
 * Preset avatars + banners shown in the onboarding picker.
 *
 * Using DiceBear (free, deterministic SVG avatars) for profile pics
 * and Picsum (free seeded photos) for banners. No credentials needed,
 * everything is public-domain / CC.
 *
 * Admins can later replace this list with your own CDN URLs.
 */

const AVATAR_SEEDS = [
  'aurora','blaze','cipher','dusk','echo','frost',
  'glitch','horizon','ion','jolt','karma','lumen',
  'mirage','nova','orbit','phantom','quasar','rune',
  'shadow','tempest','umbra','vortex','wraith','xenon',
  'yonder','zephyr','arsenal','blitz','crimson','drift',
  'ember','flux','grim','hex','inferno','jade',
]

export const AVATAR_PRESETS: { url: string; alt: string }[] =
  AVATAR_SEEDS.map(seed => ({
    url: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundType=gradientLinear`,
    alt: seed,
  }))

const BANNER_SEEDS = [
  201, 215, 230, 244, 256, 271, 287, 290, 312, 318,
  321, 335, 367, 380, 391, 419, 433, 442, 461, 475,
  484, 491, 503, 525, 532, 548, 567, 582, 599, 600,
]

export const BANNER_PRESETS: { url: string; alt: string }[] =
  BANNER_SEEDS.map(seed => ({
    url: `https://picsum.photos/seed/op${seed}/640/180`,
    alt: `Banner ${seed}`,
  }))
