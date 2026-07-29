import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      category: {
        createMany: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'test@example.com' });

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', display_name: 'Test User' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user, generate default categories, and return tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        display_name: 'Test User',
        currency: 'VND',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await service.register({
        email: 'test@example.com',
        password: 'password123',
        display_name: 'Test User',
      });

      expect(res.user.email).toBe('test@example.com');
      expect(res.access_token).toBe('mock_access_token');
      expect(prismaMock.category.createMany).toHaveBeenCalled();
      expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('correct_password', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        password_hash: hash,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('correct_password', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        password_hash: hash,
        display_name: 'Test User',
        currency: 'VND',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await service.login({ email: 'test@example.com', password: 'correct_password' });

      expect(res.access_token).toBe('mock_access_token');
      expect(res.user.id).toBe('u-1');
    });
  });
});
