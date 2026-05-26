// Shape of req.user once a request has passed JwtAuthGuard.

export type Role = 'technician' | 'admin';

export interface AuthenticatedUser {
  oid: string;
  email?: string;
  name?: string;
  roles: Role[];
}
