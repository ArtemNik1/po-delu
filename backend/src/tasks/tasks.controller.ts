import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateSubtaskDto,
  CreateTaskDto,
  ReorderTasksDto,
  STATUSES,
  UpdateSubtaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: STATUSES })
  @ApiOkResponse({
    description: 'Tasks of the current user, optionally filtered by status',
  })
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.tasks.findAll(user.id, status);
  }

  @Get('subtasks/all')
  listSubtasks(@CurrentUser() user: AuthUser) {
    return this.tasks.listSubtasks(user.id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Task created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto);
  }

  @Patch('reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderTasksDto) {
    return this.tasks.reorder(user.id, dto);
  }

  @Patch('subtasks/:id')
  updateSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.tasks.updateSubtask(user.id, id, dto);
  }

  @Delete('subtasks/:id')
  removeSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.removeSubtask(user.id, id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.findOne(user.id, id);
  }

  @Patch(':id/toggle')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.toggle(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user.id, id, dto);
  }

  @Post(':id/restore')
  restore(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.restore(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.remove(user.id, id);
  }

  @Post(':id/subtasks')
  addSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.tasks.addSubtask(user.id, id, dto);
  }
}
