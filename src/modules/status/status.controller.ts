import { Request, Response } from "express";
import { StatusService } from "./status.service";

export class StatusController {

  private service = new StatusService();

  status = async (req: Request, res: Response) => {

    const result = this.service.getLastExecution();

    res.json(result);

  }

}