/**
 * Load environment variables with correct priority:
 * 1. System env vars
 * 2. .env.local
 * 3. .env
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    dotenv.config({
      path: filePath,
      override: false, // do not override system vars
    });
  }
}

const root = process.cwd();

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));
