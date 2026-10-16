export type LoginInput = {
  email: string;
  password: string;
};

export type LoginUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type LoginSession = {
  accessToken: string;
  user: LoginUser;
};
