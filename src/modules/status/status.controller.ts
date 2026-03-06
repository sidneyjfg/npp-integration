import { Request, Response } from "express";
import { StatusService } from "./status.service";

export class StatusController {

  private service = new StatusService();

  status = async (req: Request, res: Response) => {

    try {

      const files = await this.service.getFiles();

      res.json({
        ok: true,
        files
      });

    } catch (err) {

      res.status(500).json({
        ok: false,
        error: "Erro ao consultar arquivos NAPP",
        details: err
      });

    }

  }

}