import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL ou Key não estão definidos.');
      throw new Error('Supabase credentials missing');
    }

    this.clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    this.logger.log('Supabase client inicializado');
  }

  getClient(): SupabaseClient {
    return this.clientInstance;
  }
}
