import cron from "node-cron";
import { ExportService } from "../modules/export/export.service";

export function startDailyExportJob() {

  const CRON = process.env.CRON || "0 2 * * *";
  const service = new ExportService();

  console.log(`Cron registrada: ${CRON}`);

  if (!cron.validate(CRON)) {
    console.error("Expressão CRON inválida:", CRON);
    return;
  }

  cron.schedule(
    CRON,
    async () => {

      console.log(`Executando cron NAPP (${CRON})`);

      try {

        await service.exportSalesAndSend();

        console.log("Exportação finalizada");

      } catch (err) {

        console.error("Erro no job:", err);

      }

    },
    {
      timezone: "America/Sao_Paulo"
    }
  );

}