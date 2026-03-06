import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { ExportController } from "./modules/export/export.controller";
import { startDailyExportJob } from "./jobs/daily-export.job";
import { StatusController } from "./modules/status/status.controller";

dotenv.config();

async function main() {
  await AppDataSource.initialize();
  const app = express();
  app.use(express.json());
  const controller = new ExportController();
  const statusController = new StatusController();

  app.get("/export/vendas", controller.export);
  app.get("/status", statusController.status);
  startDailyExportJob();

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`API rodando na porta ${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});