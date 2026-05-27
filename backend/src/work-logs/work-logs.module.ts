import { Module } from '@nestjs/common';
import { WorkLogsController } from './work-logs.controller';

@Module({ controllers: [WorkLogsController] })
export class WorkLogsModule {}
