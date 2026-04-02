import type { AuthUser } from './AuthUser';

export type LoginData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
