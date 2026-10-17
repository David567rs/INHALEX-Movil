import type { ImageSourcePropType } from 'react-native';
import type { CatalogPreviewImageKey } from '../../domain/models/CatalogPreviewProduct';

/** Existing INHALEX artwork, bundled locally for this design preview. */
export const catalogImages: Readonly<Record<CatalogPreviewImageKey, ImageSourcePropType>> = {
  eucalipto: require('../../../../../assets/catalog/eucalipto.jpeg'),
  lavanda: require('../../../../../assets/catalog/lavanda.jpeg'),
  menta: require('../../../../../assets/catalog/menta.jpeg'),
  manzanilla: require('../../../../../assets/catalog/manzanilla.jpeg'),
  canela: require('../../../../../assets/catalog/canela.jpeg'),
  rosas: require('../../../../../assets/catalog/rosas.jpeg'),
};
