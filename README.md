# Reforma Chácara

Sistema de Gestão Financeira para reforma compartilhada, usando uma stack moderna.

## Arquitetura
- **Backend**: NestJS, PostgreSQL (Supabase), integração com IA (Gemini) e Telegram.
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui.
- **Banco de Dados**: Supabase (PostgreSQL).

## Como rodar localmente

### 1. Configurar variáveis de ambiente
Crie os arquivos `.env` nas pastas `backend` e `frontend` baseando-se nos `.env.example`.

### 2. Instalar dependências
```bash
npm install
```

### 3. Rodar scripts
```bash
# Rodar tudo
npm run dev

# Ou rodar separadamente
npm run dev:backend
npm run dev:frontend
```
