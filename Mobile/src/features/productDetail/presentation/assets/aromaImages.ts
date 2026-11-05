import type { ImageSourcePropType } from 'react-native';

// Exact bottle photography recovered from the original mobile app. Collection
// ingredient photos live separately, so a leaf note never chooses another bottle.
const bottles: Readonly<Record<string, ImageSourcePropType>> = {
  anis: require('../../../../../assets/aromas/anis.jpeg'),
  bugambilia: require('../../../../../assets/aromas/bugambilia.jpeg'),
  cafe: require('../../../../../assets/aromas/cafe.jpeg'),
  canela: require('../../../../../assets/aromas/canela.jpeg'),
  copal: require('../../../../../assets/aromas/copal.jpeg'),
  eucalipto: require('../../../../../assets/aromas/eucalipto.jpeg'),
  hierbabuena: require('../../../../../assets/aromas/hierbabuena.jpeg'),
  jengibre: require('../../../../../assets/aromas/jengibre.jpeg'),
  lavanda: require('../../../../../assets/aromas/lavanda.jpeg'),
  manzanilla: require('../../../../../assets/aromas/manzanilla.jpeg'),
  menta: require('../../../../../assets/aromas/menta.jpeg'),
  mirra: require('../../../../../assets/aromas/mirra.jpeg'),
  rosas: require('../../../../../assets/aromas/rosas.jpeg'),
  toronjil: require('../../../../../assets/aromas/toronjil.jpeg'),
  vaporub: require('../../../../../assets/aromas/vaporub.jpeg'),
};

const aliases: Readonly<Record<string, string>> = {
  'anis-estrella': 'anis',
  'mirra-azafran': 'mirra',
  'mirra-y-azafran': 'mirra',
  'rosas-castilla': 'rosas',
  'rosas-de-castilla': 'rosas',
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function getAromaProductImage(product: { name: string; image: string | null }): ImageSourcePropType | null {
  // An explicit remote image belongs to the API product, even when its name
  // happens to match a legacy aroma. It must never be silently replaced.
  if (product.image && /^https?:\/\//i.test(product.image)) return null;
  let filename = product.image?.split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop() ?? '';
  try { filename = decodeURIComponent(filename); } catch { /* Preserve a malformed filename as unmatched. */ }
  filename = filename.replace(/\.(?:jpe?g|png|webp|avif)$/i, '');
  for (const candidate of [filename, product.name]) {
    const normalized = normalize(candidate);
    const key = Object.prototype.hasOwnProperty.call(aliases, normalized) ? aliases[normalized] : normalized;
    if (Object.prototype.hasOwnProperty.call(bottles, key)) return bottles[key];
  }
  return null;
}
