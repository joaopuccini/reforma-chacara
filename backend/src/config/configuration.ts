export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3001,
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    preferredModels: process.env.GEMINI_PREFERRED_MODELS?.split(',') || ['gemini-2.5-flash'],
  },
});
