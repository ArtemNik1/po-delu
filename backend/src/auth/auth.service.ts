import type { StringValue } from 'ms';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const displayName =
      dto.displayName?.trim() || email.split('@')[0] || 'User';

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        settings: { create: {} },
      },
    });

    return this.buildAuthResponse(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user.id, user.email, user.displayName);
  }

  async me(userId: string) {
    return this.users.getPublicProfile(userId);
  }

  private buildAuthResponse(
    id: string,
    email: string,
    displayName: string | null,
  ) {
    const accessToken = this.jwt.sign(
      { sub: id, email },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_EXPIRES_IN',
          '7d',
        ) as StringValue,
      },
    );

    return {
      accessToken,
      user: {
        id,
        email,
        displayName,
      },
    };
  }
}
