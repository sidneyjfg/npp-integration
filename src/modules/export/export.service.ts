import { AppDataSource } from "../../data-source";
import { Parser as Json2CsvParser } from "json2csv";
import dayjs from "dayjs";
import { NappClient } from "./napp.client";
import fs from "fs";
import path from "path";

export class ExportService {
    async exportSalesAndSend(): Promise<{ fileName: string; rows: number }> {

        const sales = await AppDataSource.query(`
      SELECT  
        nf.xano                                                                                   AS Id_Venda,
        nf.nfno                                                                                   AS Nota_Fiscal,
        CONCAT(DATE_FORMAT(nf.issuedate,"%Y-%m-%d")," ",IFNULL(SEC_TO_TIME(pxa.time),"12:00:00")) AS Data,
        TRUNCATE(nf.grossamt/100,2)                                                               AS Valor_Liquido,
        CASE
          WHEN nf.status = 0 THEN "Vendido"
          WHEN nf.status = 1 THEN "Cancelado"

        END                                                                                       AS Situacao
FROM 
        sqldados.nf
LEFT JOIN
        sqlpdv.pxa USING (storeno, pdvno, xano)

WHERE
        nf.issuedate = CURDATE() - INTERVAL 1 DAY AND
        nf.storeno = 5 AND
        nf.cfo IN (5102, 6102)

UNION
SELECT
        inv.invno                                                                                               AS Id_Venda,
        inv.nfname                                                                                              AS Nota_Fiscal,
        CONCAT(DATE_FORMAT(inv.issue_date,"%Y-%m-%d")," ",IFNULL(SUBSTRING(dataHoraStrEnvio,12,8),"12:00:00"))  AS Data,
        TRUNCATE(inv.grossamt/100,2)*-1                                                                         AS Valor_Liquido,
        CASE 
          WHEN inv.type IN (2,5,10) THEN "Devolucao"
          WHEN inv.type = 3 THEN "Troca"

        END                                                                                                     AS Situacao
FROM
        sqldados.inv 
LEFT JOIN
        sqldados.invnfe USING (invno)
WHERE
        inv.issue_date = CURDATE() - INTERVAL 1 DAY AND
        inv.type IN (2,3,5,10) AND
        inv.storeno = 5 AND
        inv.cfo IN (1202,2202)

ORDER BY
        Data
    `);

        const fields = [
            "Id_Venda",
            "Nota_Fiscal",
            "Data",
            "Valor_Liquido",
            "Situacao"
        ];

        const parser = new Json2CsvParser({
            fields,
            delimiter: ";",
            withBOM: true
        });

        const csv = parser.parse(sales);
        console.log(`📊 Total de linhas: ${sales.length}`);

        if (sales.length === 0) {
            console.warn("⚠️ Nenhum dado retornado pela query!");
        } else {
            console.log("📄 Preview do CSV (primeiras linhas):");
            console.log(csv.split("\n").slice(0, 5).join("\n"));
        }
        const fileBytes = Buffer.from(csv, "utf8");

        const fileName = `vendas_${dayjs().format("YYYYMMDD")}.csv`;
        const logsDir = path.resolve(process.cwd(), "logs");

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const logFilePath = path.join(logsDir, fileName);
        fs.writeFileSync(logFilePath, csv, "utf8");

        console.log(`💾 CSV salvo em log: ${logFilePath}`);
        const shouldSend = process.env.SEND_TO_NAPP !== "false";

        if (!shouldSend) {
            console.log("🧪 MODO DEBUG: envio para Napp DESATIVADO");
            console.log(`📄 Arquivo gerado: ${fileName}`);
            console.log(`📦 Tamanho: ${fileBytes.length} bytes`);
        } else {
            const napp = new NappClient(process.env.NAPP_BASE_URL!);

            const token = await napp.authenticate(
                process.env.NAPP_USERNAME!,
                process.env.NAPP_PASSWORD!
            );

            console.log(`🔐 Token obtido`);

            const signedUrl = await napp.getSignedUploadUrl(
                token,
                process.env.NAPP_FILE_TYPE ?? "vendas",
                fileName
            );

            await napp.uploadToSignedUrl(signedUrl, fileBytes, fileName);

            console.log(`🚀 Upload concluído! Arquivo: ${fileName}`);
            console.log(`📦 Tamanho do arquivo: ${fileBytes.length} bytes`);
        }
        return {
            fileName,
            rows: sales.length
        };
    }
}