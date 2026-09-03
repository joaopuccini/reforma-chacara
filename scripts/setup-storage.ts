import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// O backend env
dotenv.config({ path: resolve(process.cwd(), '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Tentando criar o bucket "comprovantes"...');
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Erro ao listar buckets:', listError.message);
    process.exit(1);
  }
  
  const exists = buckets.find(b => b.name === 'comprovantes');
  if (exists) {
    console.log('O bucket "comprovantes" já existe. Atualizando para público...');
    const { error: updateError } = await supabase.storage.updateBucket('comprovantes', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf']
    });
    if (updateError) {
      console.warn('Não foi possível atualizar o bucket (pode já estar público):', updateError.message);
    } else {
      console.log('Bucket "comprovantes" configurado como público com sucesso.');
    }
  } else {
    const { data, error } = await supabase.storage.createBucket('comprovantes', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error('Erro ao criar bucket:', error.message);
      process.exit(1);
    }
    
    console.log('Bucket "comprovantes" criado com sucesso!', data);
  }
  
  console.log('\n=== ATENÇÃO: AÇÃO MANUAL NECESSÁRIA NO SUPABASE ===');
  console.log('Você precisa ir no painel do Supabase > SQL Editor e rodar o seguinte comando:');
  console.log('');
  console.log('ALTER TABLE despesas ADD COLUMN IF NOT EXISTS comprovante_url TEXT;');
  console.log('');
  console.log('Feito isso, o banco estará pronto!');
}

setup();
