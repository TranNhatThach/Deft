import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'default_jwt_access_secret_deft',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: rawRefreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash,
        display_name: dto.display_name,
        currency: 'VND',
      },
    });

    // Create default categories for user
    const defaultCategories = [
      { name: 'Ăn uống', icon: 'utensils', type: 'expense' as const },
      { name: 'Di chuyển', icon: 'car', type: 'expense' as const },
      { name: 'Mua sắm', icon: 'shopping-bag', type: 'expense' as const },
      { name: 'Giải trí', icon: 'gamepad-2', type: 'expense' as const },
      { name: 'Hóa đơn', icon: 'receipt', type: 'expense' as const },
      { name: 'Lương', icon: 'wallet', type: 'income' as const },
      { name: 'Thu nhập khác', icon: 'trending-up', type: 'income' as const },
    ];

    await this.prisma.category.createMany({
      data: defaultCategories.map((c) => ({
        user_id: user.id,
        name: c.name,
        icon: c.icon,
        type: c.type,
      })),
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        currency: user.currency,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        currency: user.currency,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refresh_token);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị vô hiệu hóa');
    }

    if (new Date() > storedToken.expires_at) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // Token Rotation: Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Issue new pair
    return this.generateTokens(storedToken.user_id, storedToken.user.email);
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refresh_token);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }
}
