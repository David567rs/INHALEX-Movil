import { RegisterScreen } from '@/features/auth/presentation/screens/RegisterScreen';
import { useState } from 'react';
import { createRegistrationActions } from '@/bootstrap/createApplicationServices';

export default function RegisterRoute() {
  const [actions] = useState(() => createRegistrationActions());
  return <RegisterScreen actions={actions} />;
}
