import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

function toCategoryDto(category: Category) {
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    created_at: category.createdAt.toISOString(),
    updated_at: category.updatedAt.toISOString(),
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toCategoryDto);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name.trim(),
        icon: dto.icon?.trim() || 'sparkles',
        color: dto.color ?? null,
      },
    });
    return toCategoryDto(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.requireOwn(userId, id);
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon.trim() } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
      },
    });
    return toCategoryDto(category);
  }

  async remove(userId: string, id: string) {
    await this.requireOwn(userId, id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async requireOwn(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
