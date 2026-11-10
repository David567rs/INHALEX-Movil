export type RegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisteredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type RegistrationChallenge = {
  challengeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type RegistrationVerification = {
  challengeId: string;
  code: string;
};
