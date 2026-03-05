import { Request, Response } from "express";
import { ExportService } from "./export.service";

export class ExportController {
  private service = new ExportService();

  export = async (req: Request, res: Response) => {
    const result = await this.service.exportSalesAndSend();

    res.json({
      ok: true,
      ...result
    });
  };
}