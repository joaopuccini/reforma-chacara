import { Injectable, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../database/supabase.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.bootstrapAdmin();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const client = this.supabaseService.getClient();
      
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        this.logger.error(`Erro ao buscar usuário: ${error.message} (code: ${error.code})`);
        return null;
      }

      if (!user || !user.is_active) {
        return null;
      }

      const isMatch = await bcrypt.compare(pass, user.password_hash);
      if (isMatch) {
        const { password_hash, ...result } = user;
        return result;
      }
      return null;
    } catch (e: any) {
      this.logger.error(`Exceção em validateUser: ${e.message}`);
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (e: any) {
      // Re-lança exceções HTTP (401, 403) sem transformar em 500
      if (e?.status) throw e;
      this.logger.error(`Erro inesperado no login: ${e.message}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  private async bootstrapAdmin() {
    const adminEmail = this.configService.get<string>('auth.adminEmail');
    const adminPassword = this.configService.get<string>('auth.adminPassword');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('ADMIN_EMAIL ou ADMIN_PASSWORD não configurados. Bootstrap ignorado.');
      return;
    }

    try {
      const client = this.supabaseService.getClient();
      
      // Verifica se a tabela users existe e tenta buscar o admin
      const { data, error } = await client
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .maybeSingle();

      // Se ocorreu erro (ex: tabela não existe), aborta o bootstrap silenciosamente
      if (error && error.code !== 'PGRST116') {
        this.logger.error(`Erro ao verificar admin na tabela users: ${error.message}`);
        return;
      }

      // Se o usuário não existir, cria o admin
      if (!data) {
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(adminPassword, saltOrRounds);

        const { error: insertError } = await client.from('users').insert([{
          email: adminEmail,
          password_hash: hash,
          name: 'Administrador (Auto-Seed)',
          role: 'admin',
        }]);

        if (insertError) {
          this.logger.error(`Falha ao inserir Admin padrão: ${insertError.message}`);
        } else {
          this.logger.log('✨ Admin padrão criado com sucesso a partir das variáveis de ambiente.');
        }
      }
    } catch (e: any) {
      this.logger.error(`Erro no bootstrapAdmin: ${e.message}`);
    }
  }
}
