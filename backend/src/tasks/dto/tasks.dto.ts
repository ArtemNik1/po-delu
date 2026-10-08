import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const STATUSES = ['todo', 'in_progress', 'done'] as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const SORT_ORDER_MAX = 2_147_483_647;

/** A real clock time is checked. `null` and `''` clear the field. */
function WhenTime(): PropertyDecorator {
  return ValidateIf(
    (_, value: unknown) =>
      value !== undefined && value !== null && value !== '',
  );
}

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Omitted fields skip validation. null is still validated and rejected. */
function WhenPresent(): PropertyDecorator {
  return ValidateIf((_, value: unknown) => value !== undefined);
}

export class CreateTaskDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ default: '' })
  @WhenPresent()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'medium' })
  @WhenPresent()
  @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];

  @ApiPropertyOptional({ enum: STATUSES, default: 'todo' })
  @WhenPresent()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @ApiProperty({ example: '2026-09-30' })
  @IsString()
  @Matches(DATE, { message: 'dueDate must be YYYY-MM-DD' })
  dueDate!: string;

  @ApiPropertyOptional({ nullable: true, example: '09:30' })
  @WhenTime()
  @IsString()
  @Matches(TIME, { message: 'dueTime must be HH:mm or HH:mm:ss' })
  dueTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  sortOrder?: number;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @Transform(trimString)
  @WhenPresent()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @WhenPresent()
  @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];

  @ApiPropertyOptional({ enum: STATUSES })
  @WhenPresent()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @ApiPropertyOptional({ example: '2026-09-30' })
  @WhenPresent()
  @IsString()
  @Matches(DATE, { message: 'dueDate must be YYYY-MM-DD' })
  dueDate?: string;

  @ApiPropertyOptional({ nullable: true, example: '09:30' })
  @WhenTime()
  @IsString()
  @Matches(TIME, { message: 'dueTime must be HH:mm or HH:mm:ss' })
  dueTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  sortOrder?: number;
}

export class ReorderItemDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  sortOrder!: number;
}

export class ReorderTasksDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}

export class CreateSubtaskDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}

export class UpdateSubtaskDto {
  @ApiPropertyOptional()
  @Transform(trimString)
  @WhenPresent()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  sortOrder?: number;
}
