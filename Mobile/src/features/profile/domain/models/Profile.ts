export type Profile = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}>;

export type ProfileDraft = Readonly<{
  firstName: string;
  lastName: string;
  phone: string;
}>;

export type ProfileField = keyof ProfileDraft;
export type ProfileFieldErrors = Partial<Record<ProfileField, string>>;
