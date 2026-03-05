import { AppDataSource } from "../../data-source";
import { Parser as Json2CsvParser } from "json2csv";
import dayjs from "dayjs";
import { NappClient } from "./napp.client";

export class ExportService {
    async exportSalesAndSend(): Promise<{ fileName: string; rows: number }> {

        const sales = await AppDataSource.query(`
      SELECT  
        nf.xano AS id_venda,
        nf.nfno AS numero_nota,
        CONCAT(DATE_FORMAT(nf.issuedate,"%Y-%m-%d")," ",IFNULL(SEC_TO_TIME(pxa.time),"12:00:00")) AS data_hora_venda,
        TRUNCATE(nf.grossamt/100,2) AS valor_liquido,
        CASE
          WHEN nf.status = 0 THEN "Vendido"
          WHEN nf.status = 1 THEN "Cancelado"
        END AS status
      FROM sqldados.nf
      LEFT JOIN sqlpdv.pxa USING (storeno, pdvno, xano)
      WHERE nf.issuedate = CURDATE() - INTERVAL 1 DAY
      AND nf.storeno = 5

      UNION

      SELECT
        inv.invno AS id_venda,
        inv.nfname AS numero_nota,
        CONCAT(DATE_FORMAT(inv.issue_date,"%Y-%m-%d")," ",IFNULL(SUBSTRING(dataHoraStrEnvio,12,8),"12:00:00")) AS data_hora_venda,
        TRUNCATE(inv.grossamt/100,2) AS valor_liquido,
        CASE 
          WHEN inv.type IN (2,5,10) THEN "Devolucao"
          WHEN inv.type = 3 THEN "Troca"
        END AS status
      FROM sqldados.inv 
      LEFT JOIN sqldados.invnfe USING (invno)
      WHERE inv.issue_date = CURDATE() - INTERVAL 1 DAY
      AND inv.type IN (2,3,5,10)
      AND inv.storeno = 5

      ORDER BY data_hora_venda
    `);

        const fields = [
            "id_venda",
            "numero_nota",
            "data_hora_venda",
            "valor_liquido",
            "status"
        ];

        const parser = new Json2CsvParser({
            fields,
            delimiter: ";",
            withBOM: true
        });

        const csv = parser.parse(sales);
        const fileBytes = Buffer.from(csv, "utf8");

        const fileName = `vendas_${dayjs().format("YYYYMMDD")}.csv`;

        const napp = new NappClient(process.env.NAPP_BASE_URL!);

        const token = await napp.authenticate(
            process.env.NAPP_USERNAME!,
            process.env.NAPP_PASSWORD!
        );

        const signedUrl = await napp.getSignedUploadUrl(
            token,
            process.env.NAPP_FILE_TYPE ?? "vendas",
            fileName
        );

        await napp.uploadToSignedUrl(signedUrl, fileBytes, fileName);
        return {
            fileName,
            rows: sales.length
        };
    }
}