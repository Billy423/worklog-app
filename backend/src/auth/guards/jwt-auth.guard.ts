// Standard AuthGuard('jwt') with a dev short-circuit:
// when AUTH_BYPASS=true, skip token validation and attach a stub user so the
// prototype works before Azure AD provisioning. Logs a WARN every time so it
// can never be silently left on in a deployed environment.

import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Env } from '../../config/env.schema';
import type { AuthenticatedUser } from '../types/user';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private readonly config: ConfigService<Env, true>) {
        super();
    }

    canActivate(context: ExecutionContext) {
        if (this.config.get('AUTH_BYPASS', { infer: true })) {
            const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
            const role = this.config.get('AUTH_BYPASS_ROLE', { infer: true });
            req.user = {
                oid: 'dev-user-oid',
                email: 'dev@worklog.local',
                name: 'Dev User',
                roles: [role],
            };
            this.logger.warn(
                `AUTH_BYPASS active — request authenticated as stub user with role "${role}"`,
            );
            return true;
        }
        return super.canActivate(context);
    }
}
