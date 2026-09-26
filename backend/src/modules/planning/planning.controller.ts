import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { CreateWorkStageDto, CreateExecutionScheduleDto, CreatePlanningCostDto } from './dto/create-planning.dto';

@Controller('api/v1/planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('stages')
  getWorkStages() {
    return this.planningService.getWorkStages();
  }

  @Post('stages')
  createWorkStage(@Body() dto: CreateWorkStageDto) {
    return this.planningService.createWorkStage(dto);
  }

  @Get('schedules')
  getExecutionSchedules() {
    return this.planningService.getExecutionSchedules();
  }

  @Post('schedules')
  createExecutionSchedule(@Body() dto: CreateExecutionScheduleDto) {
    return this.planningService.createExecutionSchedule(dto);
  }

  @Get('costs')
  getPlanningCosts() {
    return this.planningService.getPlanningCosts();
  }

  @Post('costs')
  createPlanningCost(@Body() dto: CreatePlanningCostDto) {
    return this.planningService.createPlanningCost(dto);
  }

  @Post('floorplan/save')
  saveFloorplan(@Body() data: any) {
    return this.planningService.saveFloorplan(data);
  }

  @Get('floorplan/versions')
  getFloorplanVersions() {
    return this.planningService.getFloorplanVersions();
  }

  @Get('floorplan/download/:fileName')
  downloadFloorplan(@Param('fileName') fileName: string) {
    return this.planningService.downloadFloorplan(fileName);
  }

  @Post('floorplan/chat')
  chatFloorplan(@Body() data: any) {
    return this.planningService.chatFloorplan(data);
  }

  @Post('floorplan/budget-diff')
  estimateBudgetFromDiff(@Body() data: any) {
    return this.planningService.estimateBudgetFromDiff(data);
  }
}
