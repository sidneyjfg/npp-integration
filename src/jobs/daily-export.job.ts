import cron from "node-cron";
import { ExportService } from "../modules/export/export.service";
import dotenv from "dotenv";

dotenv.config();
export function startDailyExportJob() {
  const CRON = process.env.CRON || "0 2 * * *"; // padrão: todo dia às 02:00
  const service = new ExportService();

  // todo dia às 02:00
  cron.schedule(CRON, async () => {
    console.log("Iniciando exportação NAPP...");

    try {

      await service.exportSalesAndSend();

      console.log("Exportação finalizada");

    } catch (err) {
      console.error("Erro no job:", err);
    }
  });
}