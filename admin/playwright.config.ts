import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env.test if present (checks admin/.env.test and backend/.env.test)
const envCandidates = [
  path.resolve(__dirname, '.env.test'),
  path.resolve(__dirname, '../backend/.env.test'),
  path.resolve(__dirname, '../.env.test'),
];

for (const envFile of envCandidates) {
  if (fs.existsSync(envFile)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envFile);
      }
    } catch {
      // Ignore if load fails
    }
  }
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
