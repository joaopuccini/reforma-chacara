import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);
  
  app.use(helmet());
  app.enableCors();
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    // IMPORTANTE: forbidNonWhitelisted removido propositalmente.
    // O Telegram envia campos extras no webhook que nao estao no DTO,
    // causando erro 400 silencioso e o bot parando de responder.
  }));
  
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = configService.get<number>('port') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
