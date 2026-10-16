import { RegisterScreen } from '@/features/auth/presentation/screens/RegisterScreen';
import { useState } from 'react';
import { createRegistrationAction } from '@/bootstrap/createApplicationServices';

export default function RegisterRoute() {
  const [registerUser] = useState(() => createRegistrationAction());
  return <RegisterScreen registerUser={registerUser} />;
}
