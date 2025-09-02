/**
 * Secure Storage Utility
 * Provides encryption/decryption for sensitive data stored in sessionStorage
 * Uses AES-GCM encryption for maximum security
 */

interface StorageItem {
  value: string;
  timestamp: number;
  encrypted: boolean;
  expiresAt?: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
}

class SecureStorage {
  private readonly encryptionKey: string;
  private readonly sessionTimeout: number; // in minutes

  constructor() {
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.sessionTimeout = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '60');

    if (this.encryptionKey === 'default-key-change-in-production') {
      console.warn('⚠️ Using default encryption key. Please set VITE_ENCRYPTION_KEY in your .env.local file');
    }
  }

  /**
   * Generate a cryptographic key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data using AES-GCM
   */
  private async encrypt(data: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(this.encryptionKey, salt.buffer);
    const encodedData = encoder.encode(data);

    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);

    return {
      data: Array.from(new Uint8Array(encryptedData))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      iv: Array.from(iv)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      salt: Array.from(salt)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
  }

  /**
   * Decrypt sensitive data using AES-GCM
   */
  private async decrypt(encryptedData: EncryptedData): Promise<string> {
    const decoder = new TextDecoder();

    const data = new Uint8Array(encryptedData.data.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const iv = new Uint8Array(encryptedData.iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const salt = new Uint8Array(encryptedData.salt.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

    const key = await this.deriveKey(this.encryptionKey, salt.buffer);

    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);

    return decoder.decode(decryptedData);
  }

  /**
   * Check if an item has expired
   */
  private isExpired(item: StorageItem): boolean {
    if (item.expiresAt && Date.now() > item.expiresAt) {
      return true;
    }

    // Check session timeout
    const sessionAge = (Date.now() - item.timestamp) / (1000 * 60); // in minutes
    return sessionAge > this.sessionTimeout;
  }

  /**
   * Store data in sessionStorage with optional encryption
   */
  async setItem(key: string, value: string, options: { encrypt?: boolean; expiresIn?: number } = {}): Promise<void> {
    try {
      const { encrypt = false, expiresIn } = options;

      let processedValue = value;
      if (encrypt) {
        const encrypted = await this.encrypt(value);
        processedValue = JSON.stringify(encrypted);
      }

      const storageItem: StorageItem = {
        value: processedValue,
        timestamp: Date.now(),
        encrypted: encrypt,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
      };

      sessionStorage.setItem(key, JSON.stringify(storageItem));
    } catch (error) {
      console.error('❌ Failed to store item:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * Retrieve data from sessionStorage with automatic decryption
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const storageItem: StorageItem = JSON.parse(stored);

      // Check if expired
      if (this.isExpired(storageItem)) {
        this.removeItem(key);
        return null;
      }

      let value = storageItem.value;

      if (storageItem.encrypted) {
        const encryptedData: EncryptedData = JSON.parse(value);
        value = await this.decrypt(encryptedData);
      }

      return value;
    } catch (error) {
      console.error('❌ Failed to retrieve item:', error);
      this.removeItem(key); // Remove corrupted item
      return null;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    sessionStorage.clear();
  }

  /**
   * Get all keys that match a prefix
   */
  getKeys(prefix?: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<void> {
    const keys = this.getKeys();
    const cleanupPromises = keys.map(async (key) => {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const storageItem: StorageItem = JSON.parse(stored);
          if (this.isExpired(storageItem)) {
            this.removeItem(key);
          }
        }
      } catch {
        // Remove corrupted items
        this.removeItem(key);
      }
    });

    await Promise.all(cleanupPromises);
  }

  /**
   * Store sensitive credentials with encryption
   */
  async setCredentials(credentials: { projectName: string; domain: string; email: string; apiToken: string }): Promise<void> {
    const promises = [
      this.setItem('jira-project-name', credentials.projectName),
      this.setItem('jira-domain', credentials.domain),
      this.setItem('jira-email', credentials.email, { encrypt: true }),
      this.setItem('jira-api-token', credentials.apiToken, { encrypt: true }),
    ];

    await Promise.all(promises);
  }

  /**
   * Get stored credentials with automatic decryption
   */
  async getCredentials(): Promise<{
    projectName: string;
    domain: string;
    email: string;
    apiToken: string;
  }> {
    const [projectName, domain, email, apiToken] = await Promise.all([
      this.getItem('jira-project-name'),
      this.getItem('jira-domain'),
      this.getItem('jira-email'),
      this.getItem('jira-api-token'),
    ]);

    return {
      projectName: projectName || '',
      domain: domain || '',
      email: email || '',
      apiToken: apiToken || '',
    };
  }

  /**
   * Store selected project with validation
   */
  async setSelectedProject(project: Project | null): Promise<void> {
    if (project) {
      // Validate project object
      if (!project.id || !project.key || !project.name) {
        throw new Error('Invalid project object');
      }
      await this.setItem('jira-selected-project', JSON.stringify(project));
    } else {
      this.removeItem('jira-selected-project');
    }
  }

  /**
   * Get selected project
   */
  async getSelectedProject(): Promise<Project | null> {
    try {
      const stored = await this.getItem('jira-selected-project');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to parse selected project:', error);
      this.removeItem('jira-selected-project');
      return null;
    }
  }
}

// Create a singleton instance
export const secureStorage = new SecureStorage();

// Initialize cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired items on initialization
  secureStorage.cleanup().catch(console.error);

  // Set up periodic cleanup (every 5 minutes)
  setInterval(() => {
    secureStorage.cleanup().catch(console.error);
  }, 5 * 60 * 1000);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    secureStorage.cleanup().catch(console.error);
  });
}

export default secureStorage;
