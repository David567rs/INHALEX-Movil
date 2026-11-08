import { OrderReceiptScreen } from './OrderReceiptScreen';

// Temporary native acceptance fixture; production uses the API-backed providers.
const DevelopmentScreen = __DEV__
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Do not load the fixture in production.
  ? (require('../../development/ReceiptEmptyDevelopmentScreen') as typeof import('../../development/ReceiptEmptyDevelopmentScreen')).ReceiptEmptyDevelopmentScreen
  : null;

export function OrderReceiptEntryScreen() {
  return DevelopmentScreen ? <DevelopmentScreen /> : <OrderReceiptScreen />;
}
