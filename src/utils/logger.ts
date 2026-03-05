import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function timestamp() {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

function getFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `napp-${date}.log`);
}

export function logSend(file: string) {
  const line = `${timestamp()} | Enviando arquivo ${file}\n`;
  fs.appendFileSync(getFile(), line);
  console.log(line.trim());
}

export function logSuccess(file: string) {
  const line = `${timestamp()} | Upload concluído ${file}\n`;
  fs.appendFileSync(getFile(), line);
  console.log(line.trim());
}

export function logError(file: string, err: any) {
  const msg = err?.message || err;
  const line = `${timestamp()} | ERRO ${file} | ${msg}\n`;
  fs.appendFileSync(getFile(), line);
  console.error(line.trim());
}