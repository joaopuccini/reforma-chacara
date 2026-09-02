# Software Design Document (SDD): Sistema de Gestão Financeira Reforma Chácara

- **Status**: Ready for Implementation
- **Author**: Tech Lead / Architecture Team
- **Stack Backend**: Node.js, NestJS, TypeScript, Supabase (@supabase/supabase-js), Telegram Bot API, Google Gemini API (`@google/genai` ou HTTPS REST)
- **Stack Frontend**: React 19 / Vite, TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **Deployment**:
  - Backend: Render / Railway / Koyeb (Docker ou Node Runtime)
  - Frontend: GitHub Pages / Cloudflare Pages
  - Database: Supabase Cloud

---

## 1. Visão Geral e Objetivos do Sistema

O objetivo deste projeto é substituir a planilha do Google Sheets e o Google Apps Script por um ecossistema desacoplado, auditável e resiliente para o controle financeiro de uma reforma compartilhada entre dois sócios (**João** e **Fofo**, divisão 50/50).

O sistema é composto por:
1. **API RESTful em NestJS**: CRUD completo de despesas, endpoints de agregação/métricas financeiras, cálculo de acerto de contas e webhook para Telegram.
2. **Camada Multimodal de IA (Gemini)**: Processa mensagens de texto livre, fotos de notas fiscais/recibos e mensagens de voz/áudio oriundas do Telegram, mapeando e persistindo registros no banco de dados relacional.
3. **Frontend SPA (React + Vite)**: Dashboard moderno, responsivo para mobile e desktop, contendo cards de resumo com cálculo dinâmico de débitos/créditos, listagem tabular paginada com ordenação/filtros e modal para inserção/edição/exclusão manual.
4. **Script de Migração**: Importação segura de dados pré-existentes.

---

## 2. Arquitetura do Repositório (Monorepo)

O repositório deve ser estruturado no padrão monorepo:

```text
reforma-chacara/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── filters/http-exception.filter.ts
│   │   │   ├── guards/api-key.guard.ts
│   │   │   └── interceptors/logging.interceptor.ts
│   │   ├── config/
│   │   │   └── configuration.ts
│   │   ├── modules/
│   │   │   ├── database/
│   │   │   │   ├── database.module.ts
│   │   │   │   └── supabase.service.ts
│   │   │   ├── expenses/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-expense.dto.ts
│   │   │   │   │   ├── update-expense.dto.ts
│   │   │   │   │   └── query-expense.dto.ts
│   │   │   │   ├── entities/expense.entity.ts
│   │   │   │   ├── expenses.controller.ts
│   │   │   │   ├── expenses.module.ts
│   │   │   │   └── expenses.service.ts
│   │   │   └── telegram/
│   │   │       ├── dto/telegram-update.dto.ts
│   │   │       ├── services/gemini-parser.service.ts
│   │   │       ├── telegram.controller.ts
│   │   │       ├── telegram.module.ts
│   │   │       └── telegram.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (Button, Dialog, Input, Select, Badge, Card, etc.)
│   │   │   ├── ExpenseFormModal.tsx
│   │   │   ├── ExpenseTable.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   └── Navbar.tsx
│   │   ├── hooks/
│   │   │   ├── useExpenses.ts
│   │   │   └── useMetrics.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── expense.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
├── scripts/
│   ├── migrate-from-sheets.ts
│   └── package.json
├── .gitignore
└── README.md

```

---

## 3. Esquema e Regras do Banco de Dados (Supabase / PostgreSQL)

### 3.1 DDL da Tabela `despesas`

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Mão de Obra', 'Material para a Casa', 'Material de Apoio', 'Serviços e Locações')),
    subcategoria VARCHAR(50) NOT NULL,
    valor_bruto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_final NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pago' CHECK (status IN ('Pago', 'Pendente')),
    parcelas VARCHAR(50) NOT NULL DEFAULT 'À vista',
    pago_joao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pago_fofo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pendente NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    link_comprovante TEXT DEFAULT '—',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de consultas e relatórios
CREATE INDEX IF NOT EXISTS idx_despesas_created_at ON despesas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON despesas(status);

-- RLS e Policies (Segurança Básica para Client/Service Role)
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura anon" ON despesas FOR SELECT USING (true);
CREATE POLICY "Permitir mutacoes backend" ON despesas FOR ALL USING (true) WITH CHECK (true);

```

---

## 4. Backend: Especificação do NestJS

### 4.1 Variáveis de Ambiente (`backend/.env`)

```env
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=[https://gamlpyglhouedscnalqg.supabase.co](https://gamlpyglhouedscnalqg.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=eyJh... # Chave secreta de serviço para bypass de RLS no backend
SUPABASE_ANON_KEY=eyJh...

# Telegram Bot
TELEGRAM_BOT_TOKEN=8967675072:AAHyaQNolhhPnbKyA93Nrm52qWVptYSPaO0
TELEGRAM_WEBHOOK_SECRET=CHACARA_SECRET_KEY_2026

# Google Gemini API
GEMINI_API_KEY=COLE_SUA_CHAVE_AQUI
GEMINI_PREFERRED_MODELS=gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.5-pro,gemini-flash-latest,gemini-3-flash-preview

```

### 4.2 Camada de Domínio e DTOs

#### `create-expense.dto.ts`

```typescript
import { IsNotEmpty, IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsNotEmpty()
  @IsIn(['Mão de Obra', 'Material para a Casa', 'Material de Apoio', 'Serviços e Locações'])
  categoria: string;

  @IsNotEmpty()
  @IsString()
  subcategoria: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_bruto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valor_final: number;

  @IsOptional()
  @IsIn(['Pago', 'Pendente'])
  status?: string;

  @IsOptional()
  @IsString()
  parcelas?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pago_joao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pago_fofo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pendente?: number;

  @IsOptional()
  @IsString()
  link_comprovante?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

```

#### `update-expense.dto.ts`

Extensão de `PartialType(CreateExpenseDto)`.

### 4.3 Endpoints da API REST (`ExpensesController`)

* `GET /api/v1/expenses`
* **Query Params**: `page` (default: 1), `limit` (default: 20), `categoria`, `status`, `search` (busca no texto da descrição/observação), `startDate`, `endDate`.
* **Retorno**: `{ data: Expense[], meta: { total: number, page: number, totalPages: number } }`


* `GET /api/v1/expenses/:id`
* Retorna o registro específico ou 404.


* `POST /api/v1/expenses`
* Cria um novo registro validado via DTO.


* `PATCH /api/v1/expenses/:id`
* Atualiza parcialmente campos do registro.


* `DELETE /api/v1/expenses/:id`
* Exclui o registro por ID.


* `GET /api/v1/expenses/metrics`
* Retorna agregados financeiros em tempo real:


```json
{
  "totalGeral": 10766.00,
  "totalPagoJoao": 831.00,
  "totalPagoFofo": 1330.00,
  "totalPendente": 8640.00,
  "acertoContas": {
    "diferenca": 499.00,
    "devedor": "João",
    "credor": "Fofo",
    "valorCompensacao": 249.50,
    "resumoTexto": "João deve pagar R$ 249,50 para Fofo para igualar os gastos efetuados."
  },
  "totalPorCategoria": {
    "Mão de Obra": 1700.00,
    "Material para a Casa": 7191.00,
    "Material de Apoio": 670.00,
    "Serviços e Locações": 1240.00
  }
}

```



### 4.4 Módulo de Telegram e IA Gemini (`TelegramService` & `GeminiParserService`)

* **Rota**: `POST /api/v1/telegram/webhook`
* **Validação de Cabeçalho**: Header opcional `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET`.
* **Fluxo de Execução**:
1. Recebe update do Telegram (`body.message`).
2. Identifica tipo de payload:
* `voice` ou `audio`: Obtém `file_id`, consulta `https://api.telegram.org/bot<TOKEN>/getFile`, faz o download do binário via stream/buffer, converte em Base64.
* `photo`: Captura a maior resolução (`message.photo[length - 1]`), faz download e converte em Base64.
* `text`: Extrai string direta.


3. Recupera o contexto sumarizado dos últimos 15 lançamentos e o resumo financeiro atual do Supabase.
4. Executa chamada na API do Gemini (`gemini-2.5-flash` com fallback para `gemini-2.5-flash-lite` e `gemini-3-flash-preview`).
5. Decisão de Ação pela IA:
* `QUERY`: Formata resposta analítica em Markdown e envia para `sendMessage`.
* `INSERT`: Insere no banco pelo `ExpensesService` e envia recibo estruturado.
* `UPDATE`: Executa update por ID/descrição correspondente e notifica.
* `DELETE`: Remove do banco e notifica.

---

## 5. Frontend: Especificação da SPA (React + Vite + Tailwind)

### 5.1 Requisitos de Interface e Telas

1. **Header / Navbar**:
* Título com badge ("Reforma Chácara - Gestão Financeira").
* Indicador de status da API.
* Botão de ação primária `+ Nova Despesa`.


2. **Dashboard de Métricas (Top Cards)**:
* **Card 1: Total Geral da Obra** (Soma de todos os valores finais).
* **Card 2: Acerto de Contas (50/50)**:
* Destaque dinâmico em verde/azul indicando quem pagou mais e qual valor exato o outro deve transferir.


* **Card 3: Resumo João vs Fofo**:
* Subdivisão do valor total efetivamente pago por cada um.


* **Card 4: Total Pendente / A Pagar**:
* Destaque em amarelo/laranja para boletos e diárias ainda em aberto.




3. **Barra de Controle e Filtros (`FilterBar`)**:
* Input de busca textual (debounce 300ms).
* Select de Categoria (Todas, Mão de Obra, Material para a Casa, Material de Apoio, Serviços e Locações).
* Select de Status (Todos, Pago, Pendente).


4. **Tabela de Despesas (`ExpenseTable`)**:
* Colunas: Data, Descrição, Categoria / Subcategoria, Valor Final, Pago por João, Pago por Fofo, Pendente, Status, Ações (Editar / Excluir).
* Badges coloridos para status (`Pago`: verde, `Pendente`: âmbar).
* Ação de exclusão com diálogo modal de confirmação.


5. **Modal de Cadastro / Edição (`ExpenseFormModal`)**:
* Formulário com validação local contendo campos: Descrição, Categoria, Subcategoria, Valor Bruto, Desconto, Valor Final (calculado automaticamente se bruto/desconto forem preenchidos), Status, Parcelas, Pago por João, Pago por Fofo, Pendente, Observações.
* Botões rápidos de rateio:
* Botão "100% João": Preenche `pago_joao = valor_final`, zerando o resto.
* Botão "100% Fofo": Preenche `pago_fofo = valor_final`, zerando o resto.
* Botão "50/50 Meio a Meio": Calcula a divisão igual e distribui nos inputs.
* Botão "Pendente": Transfere o valor integral para `pendente` e seta `status = 'Pendente'`.

---

## 6. Script de Migração Inicial (`scripts/migrate-from-sheets.ts`)

O script deve usar `@supabase/supabase-js` para transferir os 9 registros da planilha Google já saneados diretamente para a tabela `despesas`.

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '[https://gamlpyglhouedscnalqg.supabase.co](https://gamlpyglhouedscnalqg.supabase.co)';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'COLE_A_KEY_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dadosMigracao = [
  {
    descricao: "Pedreiro (Entrada Mão de Obra)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 500.00,
    desconto: 0.00,
    valor_final: 500.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 200.00,
    pago_fofo: 300.00,
    pendente: 0.00,
    observacoes: "João via PIX (R$ 200.00) e Fofo em Dinheiro (R$ 300.00)"
  },
  {
    descricao: "Caçamba de entulho",
    categoria: "Serviços e Locações",
    subcategoria: "Limpeza / Caçamba",
    valor_bruto: 200.00,
    desconto: 0.00,
    valor_final: 200.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 200.00,
    pendente: 0.00,
    observacoes: "Fofo em Dinheiro"
  },
  {
    descricao: "Andaime e escoras",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1040.00,
    desconto: 0.00,
    valor_final: 1040.00,
    status: "Pendente",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 1040.00,
    observacoes: "Será pago no Cartão Preto do Fofo"
  },
  {
    descricao: "Caixa d'água completa",
    categoria: "Material para a Casa",
    subcategoria: "Hidráulica / Elétrica",
    valor_bruto: 456.00,
    desconto: 0.00,
    valor_final: 456.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 456.00,
    pago_fofo: 0.00,
    pendente: 0.00,
    observacoes: "Cartão de Crédito João"
  },
  {
    descricao: "Laje estrutural",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6400.00,
    desconto: 0.00,
    valor_final: 6400.00,
    status: "Pendente",
    parcelas: "3x PIX",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 6400.00,
    observacoes: "3 parcelas de R$ 2.133,33 via PIX"
  },
  {
    descricao: "Madeiramento e fôrmas",
    categoria: "Material de Apoio",
    subcategoria: "Fôrmas e Fixação",
    valor_bruto: 706.00,
    desconto: 36.00,
    valor_final: 670.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 670.00,
    pendente: 0.00,
    observacoes: "Cartão Preto do Fofo (desconto de R$ 36.00)"
  },
  {
    descricao: "Pedreiro (2ª etapa)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 1200.00,
    desconto: 0.00,
    valor_final: 1200.00,
    status: "Pendente",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 1200.00,
    observacoes: "Programado para pagamento via PIX do João"
  },
  {
    descricao: "Cimento 5 sacos",
    categoria: "Material para a Casa",
    subcategoria: "Alvenaria",
    valor_bruto: 175.00,
    desconto: 0.00,
    valor_final: 175.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 175.00,
    pago_fofo: 0.00,
    pendente: 0.00,
    observacoes: "Teste"
  },
  {
    descricao: "2 latas de tinta",
    categoria: "Material para a Casa",
    subcategoria: "Pintura",
    valor_bruto: 160.00,
    desconto: 0.00,
    valor_final: 160.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 160.00,
    pendente: 0.00,
    observacoes: "Pagamento realizado integralmente pelo Fofo"
  }
];

async function run() {
  console.log("Iniciando migração dos dados históricos para o Supabase...");
  const { data, error } = await supabase.from('despesas').insert(dadosMigracao).select();
  if (error) {
    console.error("Erro na inserção:", error);
    process.exit(1);
  }
  console.log(`Sucesso: ${data.length} registros persistidos no banco.`);
}

run();

```
