import { Module } from '@nestjs/common';
import { MetersController } from './meters.controller';

@Module({ controllers: [MetersController] })
export class MetersModule {}
