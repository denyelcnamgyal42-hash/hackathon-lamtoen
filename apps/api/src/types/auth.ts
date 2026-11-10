import type { PublicUser } from "@lamton/shared";

export interface AuthContext {
  user: PublicUser;
  csrfToken: string;
}
