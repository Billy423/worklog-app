import { Module } from '@nestjs/common';
import { MetersController } from './meters.controller';
import { MetersService } from './meters.service';
import { MetersRepository } from './meters.repository';

@Module({
    controllers: [MetersController],
    providers: [MetersService, MetersRepository],
    exports: [MetersService],
})
export class MetersModule {}
