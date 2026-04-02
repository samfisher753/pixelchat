export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  look: string | null;
  avatarUrl: string | null;
  motto: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  demo: boolean;
}
