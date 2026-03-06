import fs from "fs";
import path from "path";

export class StatusService {

  getLastExecution() {

    const logDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logDir)) {
      return {
        sent: false,
        message: "Nenhum log encontrado"
      };
    }

    const files = fs.readdirSync(logDir);

    if (files.length === 0) {
      return {
        sent: false,
        message: "Nenhum log encontrado"
      };
    }

    const latestFile = files.sort().reverse()[0];

    const content = fs.readFileSync(path.join(logDir, latestFile), "utf8");

    const lines = content.trim().split("\n");

    const lastLine = lines[lines.length - 1];

    return {
      sent: lastLine.includes("Upload concluído"),
      lastLog: lastLine
    };
  }

}