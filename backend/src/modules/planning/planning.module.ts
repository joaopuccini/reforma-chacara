import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
