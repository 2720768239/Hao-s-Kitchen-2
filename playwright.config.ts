import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run db:migrate && npm run db:seed && npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: "data/e2e/hao-kitchen.sqlite",
      UPLOAD_DIR: "data/e2e/uploads",
      CHEF_PASSWORD_HASH:
        "scrypt:e2e-salt-2026:a512fad84d145360dcec0d024f2523113a5b302b1527792e2b8cdf4e8064a029aae62505bd32cbf3ec754456ac9975492fce9f320b8901ba228b51bbff06fb7b",
      CHEF_SESSION_SECRET: "e2e-session-secret",
    },
  },
  use: {
    baseURL: "http://localhost:3100",
  },
});
