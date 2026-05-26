// Passport JWT strategy for Azure AD (Entra ID) Bearer tokens.
// Verifies signature against Azure's JWKS, checks audience + issuer, then maps
// the token payload to AuthenticatedUser (oid + roles claim).

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { Env } from '../config/env.schema';
import type { AuthenticatedUser, Role } from './types/user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    const tenantId = config.get('AZURE_TENANT_ID', { infer: true });
    const audience = config.get('AZURE_AUDIENCE', { infer: true });
    const bypass = config.get('AUTH_BYPASS', { infer: true });

    if (!bypass && (!tenantId || !audience)) {
      throw new Error('Azure AD config missing — cannot initialise JwtStrategy');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: audience ?? 'unused-in-bypass',
      issuer: tenantId
        ? `https://login.microsoftonline.com/${tenantId}/v2.0`
        : 'unused-in-bypass',
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: tenantId
          ? `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
          : 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
      }),
    });
  }

  validate(payload: Record<string, unknown>): AuthenticatedUser {
    const oid = payload['oid'] as string | undefined;
    if (!oid) throw new UnauthorizedException('Token missing oid claim');

    const rolesClaim = payload['roles'];
    const roles: Role[] = Array.isArray(rolesClaim)
      ? rolesClaim.filter((r): r is Role => r === 'technician' || r === 'admin')
      : [];

    return {
      oid,
      email: (payload['preferred_username'] ?? payload['upn']) as string | undefined,
      name: payload['name'] as string | undefined,
      roles,
    };
  }
}
