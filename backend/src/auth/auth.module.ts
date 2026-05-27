// Auth module. Global so Guards are usable from any feature module without re-import.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
    imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
    providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
    exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
