import axios from "axios";
import { logSend, logSuccess, logError } from "../../utils/logger";
import { tokenCache, isTokenValid, setToken } from "../../utils/token-cache";

type AuthResponse = { access_token: string };

type UploadRequest = {
  files: Array<{ type: string; name: string }>;
};

type UploadResponse = {
  uploadFiles: Array<{ type: string; name: string; url: string }>;
};

export class NappClient {
  constructor(private readonly baseUrl: string) {}

  async authenticate(username: string, password: string): Promise<string> {

    if (isTokenValid()) {
      return tokenCache.token!;
    }

    const { data } = await axios.post<AuthResponse>(
      `${this.baseUrl}/api/auth`,
      { username, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const token = `Bearer ${data.access_token}`;

    setToken(token, 3600);

    return token;
  }

  async getSignedUploadUrl(
    token: string,
    fileType: string,
    fileName: string
  ): Promise<string> {

    const payload: UploadRequest = {
      files: [{ type: fileType, name: fileName }]
    };

    const { data } = await axios.post<UploadResponse>(
      `${this.baseUrl}/api/upload`,
      payload,
      {
        headers: {
          "content-type": "application/json",
          Authorization: token
        }
      }
    );

    const signed = data.uploadFiles?.[0]?.url;

    if (!signed) {
      throw new Error("URL assinada não retornada pela NAPP");
    }

    return signed;
  }

  async uploadToSignedUrl(
    signedUrl: string,
    fileBytes: Buffer,
    fileName: string
  ): Promise<void> {

    try {

      logSend(fileName);

      await axios.put(signedUrl, fileBytes, {
        headers: { "Content-Type": "plain/text" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000
      });

      logSuccess(fileName);

    } catch (err) {

      logError(fileName, err);

      throw err;
    }
  }
}