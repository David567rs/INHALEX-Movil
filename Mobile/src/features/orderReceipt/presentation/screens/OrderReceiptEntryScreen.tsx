import { OrderReceiptScreen } from './OrderReceiptScreen';

// Development-only composition: production always uses the API-backed provider.
const DevelopmentScreen = __DEV__
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep the temporary fixture out of the production runtime.
  ? (require('../../development/ReceiptDevelopmentScreen') as typeof import('../../development/ReceiptDevelopmentScreen')).ReceiptDevelopmentScreen
  : null;

export function OrderReceiptEntryScreen() {
  return DevelopmentScreen ? <DevelopmentScreen /> : <OrderReceiptScreen />;
}
