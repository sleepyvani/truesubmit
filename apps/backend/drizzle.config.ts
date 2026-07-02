import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schemas/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.APP_DATABASE_URI_VALUE || 'postgresql://postgres:123456Abcxyz@localhost:5432/truesubmit',
  },
});
