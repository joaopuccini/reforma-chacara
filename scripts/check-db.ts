import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data, error } = await supabase
    .from('despesas')
    .select('id, descricao, link_comprovante, comprovante_url')
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.log('Resultados:');
    data.forEach(d => {
      console.log(`- ${d.descricao}`);
      console.log(`  link_comprovante: "${d.link_comprovante}" (length: ${d.link_comprovante?.length}, charCode: ${d.link_comprovante?.charCodeAt(0)})`);
      console.log(`  comprovante_url: "${d.comprovante_url}" (length: ${d.comprovante_url?.length})`);
    });
  }
}

run();
