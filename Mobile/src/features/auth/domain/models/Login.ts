export type LoginInput = {
  email: string;
  password: string;
};

export type LoginUser = {
  id: string;
  /** Full name of a legacy account until its split profile fields are completed. */
  displayName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type LoginSession = {
  accessToken: string;
  user: LoginUser;
};
