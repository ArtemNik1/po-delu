import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/users.dto';
import { toPublicUser } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName?.trim() || null,
      },
      include: { settings: true },
    });
    return toPublicUser(user);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme,
        language: dto.language ?? null,
        weekStartsOn: 1,
        dailyGoal: dto.dailyGoal,
        soundEnabled: dto.soundEnabled,
        onboardingCompleted: dto.onboardingCompleted,
      },
      update: {
        ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        weekStartsOn: 1,
        ...(dto.dailyGoal !== undefined ? { dailyGoal: dto.dailyGoal } : {}),
        ...(dto.soundEnabled !== undefined
          ? { soundEnabled: dto.soundEnabled }
          : {}),
        ...(dto.onboardingCompleted !== undefined
          ? { onboardingCompleted: dto.onboardingCompleted }
          : {}),
      },
    });
    return this.getPublicProfile(userId);
  }
}
