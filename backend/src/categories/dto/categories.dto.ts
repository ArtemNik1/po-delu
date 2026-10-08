import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Omitted fields skip validation. `null` is still validated and rejected. */
function WhenPresent(): PropertyDecorator {
  return ValidateIf((_, value: unknown) => value !== undefined);
}

/** `null` may clear the color. A present string is still checked. */
function WhenValue(): PropertyDecorator {
  return ValidateIf(
    (_, value: unknown) => value !== undefined && value !== null,
  );
}

export class CreateCategoryDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 'sparkles' })
  @Transform(trimString)
  @WhenPresent()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  icon?: string;

  @ApiPropertyOptional({ nullable: true })
  @WhenValue()
  @IsString()
  @MaxLength(32)
  color?: string | null;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @Transform(trimString)
  @WhenPresent()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional()
  @Transform(trimString)
  @WhenPresent()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  icon?: string;

  @ApiPropertyOptional({ nullable: true })
  @WhenValue()
  @IsString()
  @MaxLength(32)
  color?: string | null;
}
