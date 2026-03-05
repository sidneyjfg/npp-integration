import cron from "node-cron";
import { ExportService } from "../modules/export/export.service";

export function startDailyExportJob() {
  const service = new ExportService();

  // todo dia às 02:00
  cron.schedule("0 2 * * *", async () => {
    console.log("Iniciando exportação NAPP...");

    try {

      await service.exportSalesAndSend();

      console.log("Exportação finalizada");

    } catch (err) {
      console.error("Erro no job:", err);
    }
  });
}