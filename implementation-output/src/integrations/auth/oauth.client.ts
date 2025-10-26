import {
  AuthenticationResult,
  ConfidentialClientApplication,
} from "@azure/msal-node";
import { OAuth2Client } from "google-auth-library";
import { Keychain } from "../../utils/keychain";
import { logger } from "../../utils/logger";
import { MetricsService } from "../../services/metrics.service";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId?: string; // For Microsoft
  scopes: string[];
  redirectUri: string;
}

export class OAuthClient {
  private msalClient: ConfidentialClientApplication | null = null;
  private googleClient: OAuth2Client | null = null;
  private metrics: MetricsService;
  private keychain: Keychain;

  constructor() {
    this.metrics = new MetricsService();
    this.keychain = new Keychain();
  }

  async initializeMicrosoftAuth(config: OAuthConfig): Promise<void> {
    try {
      const { clientId, clientSecret, tenantId, scopes } = config;

      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId,
          clientSecret,
          authority: `https://login.microsoftonline.com/${tenantId}`,
        },
      });

      logger.info("Microsoft OAuth client initialized", {
        clientId,
        tenantId,
        scopes,
      });

      this.metrics.increment("auth.microsoft.initialized");
    } catch (error) {
      logger.error("Failed to initialize Microsoft OAuth client", { error });
      this.metrics.increment("auth.microsoft.init_failed");
      throw error;
    }
  }

  async getMicrosoftToken(): Promise<string> {
    if (!this.msalClient) {
      throw new Error("Microsoft OAuth client not initialized");
    }

    try {
      const cachedToken = await this.keychain.get("microsoft_token");
      if (cachedToken) {
        // Check if token is still valid (expires in > 5 minutes)
        const tokenData = JSON.parse(cachedToken);
        const expiresAt = new Date(tokenData.expiresOn).getTime();
        const now = Date.now();
        if (expiresAt - now > 300000) {
          return tokenData.accessToken;
        }
      }

      const result = await this.msalClient.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
      });

      if (!result) {
        throw new Error("Failed to acquire Microsoft token");
      }

      await this.keychain.set(
        "microsoft_token",
        JSON.stringify({
          accessToken: result.accessToken,
          expiresOn: result.expiresOn,
        }),
      );

      this.metrics.increment("auth.microsoft.token_acquired");
      return result.accessToken;
    } catch (error) {
      logger.error("Failed to get Microsoft token", { error });
      this.metrics.increment("auth.microsoft.token_failed");
      throw error;
    }
  }

  async initializeGoogleAuth(config: OAuthConfig): Promise<void> {
    try {
      const { clientId, clientSecret, redirectUri } = config;

      this.googleClient = new OAuth2Client(clientId, clientSecret, redirectUri);

      logger.info("Google OAuth client initialized", {
        clientId,
        redirectUri,
      });

      this.metrics.increment("auth.google.initialized");
    } catch (error) {
      logger.error("Failed to initialize Google OAuth client", { error });
      this.metrics.increment("auth.google.init_failed");
      throw error;
    }
  }

  async getGoogleToken(): Promise<string> {
    if (!this.googleClient) {
      throw new Error("Google OAuth client not initialized");
    }

    try {
      const cachedToken = await this.keychain.get("google_token");
      if (cachedToken) {
        const tokenData = JSON.parse(cachedToken);
        const expiresAt = tokenData.expiry_date;
        const now = Date.now();
        if (expiresAt - now > 300000) {
          return tokenData.access_token;
        }
      }

      const credentials = await this.keychain.get("google_credentials");
      if (!credentials) {
        throw new Error("Google credentials not found in keychain");
      }

      const { tokens } = await this.googleClient.getToken(
        JSON.parse(credentials),
      );
      await this.keychain.set("google_token", JSON.stringify(tokens));

      this.metrics.increment("auth.google.token_acquired");
      return tokens.access_token!;
    } catch (error) {
      logger.error("Failed to get Google token", { error });
      this.metrics.increment("auth.google.token_failed");
      throw error;
    }
  }

  async revokeToken(provider: "microsoft" | "google"): Promise<void> {
    try {
      if (provider === "microsoft") {
        await this.keychain.delete("microsoft_token");
      } else {
        const token = await this.keychain.get("google_token");
        if (token) {
          const tokenData = JSON.parse(token);
          await this.googleClient?.revokeToken(tokenData.access_token);
        }
        await this.keychain.delete("google_token");
      }

      logger.info(`Revoked ${provider} token`);
      this.metrics.increment(`auth.${provider}.token_revoked`);
    } catch (error) {
      logger.error(`Failed to revoke ${provider} token`, { error });
      this.metrics.increment(`auth.${provider}.revoke_failed`);
      throw error;
    }
  }
}
