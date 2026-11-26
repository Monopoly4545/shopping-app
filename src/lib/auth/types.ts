export type UserRole = "admin" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};
