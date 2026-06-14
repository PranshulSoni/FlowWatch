const { cpSync, existsSync, mkdirSync } = require("node:fs");
const { dirname, join } = require("node:path");

const packageRoot = join(__dirname, "..");
const source = join(packageRoot, "src", "dashboard", "static");
const target = join(packageRoot, "dist", "dashboard", "static");

if (!existsSync(source)) {
  throw new Error(`Dashboard static directory does not exist: ${source}`);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
