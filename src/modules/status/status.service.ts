import axios from "axios";
import { NappClient } from "../export/napp.client";

export class StatusService {

  async getFiles() {

    const napp = new NappClient(process.env.NAPP_BASE_URL!);

    const token = await napp.authenticate(
      process.env.NAPP_USERNAME!,
      process.env.NAPP_PASSWORD!
    );

    const { data } = await axios.get(
      `${process.env.NAPP_BASE_URL}/api/files/list`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    return data;
  }

}