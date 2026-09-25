import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('auth.jwtSecret') || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET nao configurado! Defina a variavel de ambiente JWT_SECRET.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('auth.jwtExpiration') || process.env.JWT_EXPIRATION || '7d') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
