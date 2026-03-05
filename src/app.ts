import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { ExportController } from "./modules/export/export.controller";
import { startDailyExportJob } from "./jobs/daily-export.job";

dotenv.config();

async function main() {
  await AppDataSource.initialize();

  const app = express();
  app.use(express.json());
  startDailyExportJob();
  const controller = new ExportController();
  app.get("/export/vendas", controller.export);

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`API rodando na porta ${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});