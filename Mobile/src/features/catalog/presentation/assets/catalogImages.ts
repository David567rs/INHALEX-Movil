import type { ImageSourcePropType } from 'react-native';
/** Exact legacy web paths refer to original bundled artwork, never to the API host. */
const legacyImages: Readonly<Record<string, ImageSourcePropType>> = {
  '/products/eucalipto.jpg': require('../../../../../assets/catalog/eucalipto.jpeg'),
  '/products/lavanda.jpg': require('../../../../../assets/catalog/lavanda.jpeg'),
  '/products/menta.jpg': require('../../../../../assets/catalog/menta.jpeg'),
  '/products/manzanilla.jpg': require('../../../../../assets/catalog/manzanilla.jpeg'),
  '/products/canela.jpg': require('../../../../../assets/catalog/canela.jpeg'),
  '/products/rosas-castilla.jpg': require('../../../../../assets/catalog/rosas.jpeg'),
  '/products/anis-estrella.jpg': require('../../../../../assets/catalog/anis.jpeg'),
  '/products/bugambilia.jpg': require('../../../../../assets/catalog/bugambilia.jpeg'),
  '/products/cafe.jpg': require('../../../../../assets/catalog/cafe.jpeg'),
  '/products/copal.jpg': require('../../../../../assets/catalog/copal.jpeg'),
  '/products/hierbabuena.jpg': require('../../../../../assets/catalog/hierbabuena.jpeg'),
  '/products/jengibre.jpg': require('../../../../../assets/catalog/jengibre.jpeg'),
  '/products/mirra-azafran.jpg': require('../../../../../assets/catalog/mirra.jpeg'),
  '/products/toronjil.jpg': require('../../../../../assets/catalog/toronjil.jpeg'),
  '/products/vaporub.jpg': require('../../../../../assets/catalog/vaporub.jpeg'),
  '/products/romero.jpg': require('../../../../../assets/catalog/romero.jpg'),
};

export function getCatalogImage(image: string | null): ImageSourcePropType | null {
  if (!image) return null;
  if (Object.prototype.hasOwnProperty.call(legacyImages, image)) return legacyImages[image];
  // The data mapper validates public HTTPS image URLs. Credentials are never attached.
  return image.startsWith('https://') ? { uri: image } : null;
}
