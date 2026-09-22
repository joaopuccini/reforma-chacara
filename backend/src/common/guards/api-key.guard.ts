import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-telegram-bot-api-secret-token'];
    
    if (!token) {
      throw new UnauthorizedException('Missing Telegram Webhook Secret Token');
    }

    const secret = this.configService.get<string>('telegram.webhookSecret');
    if (token !== secret) {
      throw new UnauthorizedException('Invalid Telegram Webhook Secret Token');
    }

    return true;
  }
}
