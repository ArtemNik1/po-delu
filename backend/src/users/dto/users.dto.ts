import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const THEMES = ['dark', 'light', 'colorblind'] as const;

function normalizeTheme({ value }: { value: unknown }): unknown {
  return value === 'system' ? 'dark' : value;
}

/** Omitted fields skip validation. `null` is still validated and rejected. */
function WhenPresent(): PropertyDecorator {
  return ValidateIf((_, value: unknown) => value !== undefined);
}

/** `null` and omitted values skip the remaining checks so a nullable field can be cleared. */
function WhenValue(): PropertyDecorator {
  return ValidateIf(
    (_, value: unknown) => value !== undefined && value !== null,
  );
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ nullable: true })
  @WhenValue()
  @IsString()
  @MaxLength(60)
  displayName?: string | null;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: THEMES })
  @WhenPresent()
  @Transform(normalizeTheme)
  @IsIn(THEMES)
  theme?: (typeof THEMES)[number];

  @ApiPropertyOptional({ nullable: true })
  @WhenValue()
  @IsString()
  @MaxLength(8)
  language?: string | null;

  @ApiPropertyOptional({ enum: [0, 1] })
  @WhenPresent()
  @IsInt()
  @IsIn([0, 1])
  weekStartsOn?: 0 | 1;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsInt()
  @Min(1)
  @Max(50)
  dailyGoal?: number;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @WhenPresent()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
