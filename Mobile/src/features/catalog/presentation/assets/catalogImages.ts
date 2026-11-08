import type { ImageSourcePropType } from 'react-native';
/** Original ingredient photography for collection cards; bottle portraits belong to product details. */
const legacyImages: Readonly<Record<string, ImageSourcePropType>> = {
  '/products/eucalipto.jpg': require('../../../../../assets/products/eucalipto.jpg'),
  '/products/lavanda.jpg': require('../../../../../assets/products/lavanda.jpg'),
  '/products/menta.jpg': require('../../../../../assets/products/menta.jpg'),
  '/products/manzanilla.jpg': require('../../../../../assets/products/manzanilla.jpg'),
  '/products/canela.jpg': require('../../../../../assets/products/canela.jpg'),
  '/products/rosas-castilla.jpg': require('../../../../../assets/products/rosas-castilla.jpg'),
  '/products/anis-estrella.jpg': require('../../../../../assets/products/anis-estrella.jpg'),
  '/products/bugambilia.jpg': require('../../../../../assets/products/bugambilia.jpg'),
  '/products/cafe.jpg': require('../../../../../assets/products/cafe.jpg'),
  '/products/copal.jpg': require('../../../../../assets/products/copal.jpg'),
  '/products/hierbabuena.jpg': require('../../../../../assets/products/hierbabuena.jpg'),
  '/products/jengibre.jpg': require('../../../../../assets/products/jengibre.jpg'),
  '/products/mirra-azafran.jpg': require('../../../../../assets/products/mirra-azafran.jpg'),
  '/products/toronjil.jpg': require('../../../../../assets/products/toronjil.jpg'),
  '/products/vaporub.jpg': require('../../../../../assets/products/vaporub.jpg'),
  '/products/romero.jpg': require('../../../../../assets/products/romero.jpg'),
};

export function getCatalogImage(image: string | null): ImageSourcePropType | null {
  if (!image) return null;
  if (Object.prototype.hasOwnProperty.call(legacyImages, image)) return legacyImages[image];
  // The data mapper validates public HTTPS image URLs. Credentials are never attached.
  return image.startsWith('https://') ? { uri: image } : null;
}
