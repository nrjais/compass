import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import type { CredentialGenerationOptions } from './connection-options';

const exec = promisify(execCallback);

interface CachedCredential {
  username: string;
  password: string;
  expiresAt: number;
}

interface CredentialGenerationResult {
  username: string;
  password: string;
}

/**
 * Service to manage dynamically generated credentials with TTL-based caching.
 */
export class CredentialCache {
  private cache: Map<string, CachedCredential> = new Map();

  /**
   * Gets credentials for a connection, either from cache or by generating new ones.
   * @param connectionId - Unique identifier for the connection
   * @param options - Credential generation options (command and TTL)
   * @returns Promise resolving to username and password
   */
  async getCredentials(
    connectionId: string,
    options: CredentialGenerationOptions
  ): Promise<CredentialGenerationResult> {
    const cached = this.cache.get(connectionId);
    const now = Date.now();

    // Return cached credentials if still valid
    if (cached && cached.expiresAt > now) {
      return {
        username: cached.username,
        password: cached.password,
      };
    }

    // Generate new credentials
    const credentials = await this.generateCredentials(options.command);

    // Cache the credentials with expiration
    this.cache.set(connectionId, {
      username: credentials.username,
      password: credentials.password,
      expiresAt: now + options.ttl * 1000, // Convert seconds to milliseconds
    });

    return credentials;
  }

  /**
   * Executes the credential generation command and parses the result.
   * @param command - Shell command to execute
   * @returns Promise resolving to generated credentials
   */
  private async generateCredentials(
    command: string
  ): Promise<CredentialGenerationResult> {
    try {
      const { stdout, stderr } = await exec(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB max buffer
      });

      if (stderr) {
        throw new Error(`Credential generation command error: ${stderr}`);
      }

      const result = JSON.parse(stdout.trim());

      if (!result.username || !result.password) {
        throw new Error(
          'Credential generation command must return JSON with "username" and "password" fields'
        );
      }

      return {
        username: result.username,
        password: result.password,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Credential generation command output is not valid JSON: ${
            (error as Error).message
          }`
        );
      }
      throw new Error(
        `Failed to generate credentials: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clears cached credentials for a specific connection.
   * @param connectionId - Unique identifier for the connection
   */
  clearCredentials(connectionId: string): void {
    this.cache.delete(connectionId);
  }

  /**
   * Clears all cached credentials.
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Singleton instance for the credential cache
export const credentialCache = new CredentialCache();
