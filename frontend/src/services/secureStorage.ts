/**
 * Secure Token Storage - улучшенная безопасность хранения токенов
 * Согласно ТЗ DevAssist Pro
 */

interface StorageOptions {
  encrypt?: boolean;
  prefix?: string;
  ttl?: number; // Time to live in milliseconds
}

interface StorageItem {
  value: string;
  timestamp: number;
  ttl?: number;
  encrypted?: boolean;
}

export class SecureStorage {
  private static readonly DEFAULT_PREFIX = 'devassist_secure_';
  private static readonly ENCRYPTION_KEY = 'devassist_key_v1'; // In production, use proper key management

  /**
   * Безопасное сохранение данных
   */
  static setItem(key: string, value: string, options: StorageOptions = {}): void {
    try {
      const {
        encrypt = true,
        prefix = this.DEFAULT_PREFIX,
        ttl
      } = options;

      const storageItem: StorageItem = {
        value: encrypt ? this.encrypt(value) : value,
        timestamp: Date.now(),
        ttl,
        encrypted: encrypt
      };

      const prefixedKey = `${prefix}${key}`;
      
      // Use sessionStorage for more sensitive data in production
      const storage = this.getStorageType(key);
      storage.setItem(prefixedKey, JSON.stringify(storageItem));

      // Log security event (без значения)
      console.log(`[SecureStorage] Item stored: ${key}`, {
        encrypted: encrypt,
        hasTTL: !!ttl,
        timestamp: storageItem.timestamp
      });
    } catch (error) {
      console.error('[SecureStorage] Failed to store item:', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Безопасное получение данных
   */
  static getItem(key: string, prefix: string = this.DEFAULT_PREFIX): string | null {
    try {
      const prefixedKey = `${prefix}${key}`;
      const storage = this.getStorageType(key);
      const storedData = storage.getItem(prefixedKey);

      if (!storedData) {
        return null;
      }

      const storageItem: StorageItem = JSON.parse(storedData);

      // Проверяем TTL
      if (storageItem.ttl && Date.now() - storageItem.timestamp > storageItem.ttl) {
        console.warn(`[SecureStorage] Item expired: ${key}`);
        this.removeItem(key, prefix);
        return null;
      }

      // Декодируем если зашифровано
      const value = storageItem.encrypted 
        ? this.decrypt(storageItem.value) 
        : storageItem.value;

      return value;
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve item:', error);
      return null;
    }
  }

  /**
   * Удаление данных
   */
  static removeItem(key: string, prefix: string = this.DEFAULT_PREFIX): void {
    try {
      const prefixedKey = `${prefix}${key}`;
      const storage = this.getStorageType(key);
      storage.removeItem(prefixedKey);
      
      console.log(`[SecureStorage] Item removed: ${key}`);
    } catch (error) {
      console.error('[SecureStorage] Failed to remove item:', error);
    }
  }

  /**
   * Очистка всех данных с префиксом
   */
  static clearAll(prefix: string = this.DEFAULT_PREFIX): void {
    try {
      const storageTypes = [localStorage, sessionStorage];
      
      storageTypes.forEach(storage => {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          storage.removeItem(key);
        });
      });
      
      console.log(`[SecureStorage] All items cleared with prefix: ${prefix}`);
    } catch (error) {
      console.error('[SecureStorage] Failed to clear storage:', error);
    }
  }

  /**
   * Проверка наличия элемента
   */
  static hasItem(key: string, prefix: string = this.DEFAULT_PREFIX): boolean {
    return this.getItem(key, prefix) !== null;
  }

  /**
   * Получение всех ключей с префиксом
   */
  static getKeys(prefix: string = this.DEFAULT_PREFIX): string[] {
    try {
      const keys: string[] = [];
      const storageTypes = [localStorage, sessionStorage];
      
      storageTypes.forEach(storage => {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(prefix)) {
            keys.push(key.substring(prefix.length));
          }
        }
      });
      
      return Array.from(new Set(keys)); // Remove duplicates
    } catch (error) {
      console.error('[SecureStorage] Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Получение информации о хранилище
   */
  static getStorageInfo(): {
    itemCount: number;
    totalSize: number;
    items: Array<{ key: string; size: number; encrypted: boolean; hasExpiry: boolean }>;
  } {
    try {
      const info = {
        itemCount: 0,
        totalSize: 0,
        items: [] as Array<{ key: string; size: number; encrypted: boolean; hasExpiry: boolean }>
      };

      const storageTypes = [
        { storage: localStorage, name: 'localStorage' },
        { storage: sessionStorage, name: 'sessionStorage' }
      ];

      storageTypes.forEach(({ storage }) => {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(this.DEFAULT_PREFIX)) {
            const value = storage.getItem(key);
            if (value) {
              try {
                const storageItem: StorageItem = JSON.parse(value);
                const size = new Blob([value]).size;
                
                info.itemCount++;
                info.totalSize += size;
                info.items.push({
                  key: key.substring(this.DEFAULT_PREFIX.length),
                  size,
                  encrypted: !!storageItem.encrypted,
                  hasExpiry: !!storageItem.ttl
                });
              } catch (parseError) {
                // Skip invalid items
              }
            }
          }
        }
      });

      return info;
    } catch (error) {
      console.error('[SecureStorage] Failed to get storage info:', error);
      return { itemCount: 0, totalSize: 0, items: [] };
    }
  }

  /**
   * Очистка устаревших элементов
   */
  static cleanupExpired(): number {
    try {
      let cleanedCount = 0;
      const storageTypes = [localStorage, sessionStorage];

      storageTypes.forEach(storage => {
        const keysToRemove: string[] = [];

        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(this.DEFAULT_PREFIX)) {
            const value = storage.getItem(key);
            if (value) {
              try {
                const storageItem: StorageItem = JSON.parse(value);
                if (storageItem.ttl && Date.now() - storageItem.timestamp > storageItem.ttl) {
                  keysToRemove.push(key);
                }
              } catch (parseError) {
                // Remove invalid items
                keysToRemove.push(key);
              }
            }
          }
        }

        keysToRemove.forEach(key => {
          storage.removeItem(key);
          cleanedCount++;
        });
      });

      console.log(`[SecureStorage] Cleaned up ${cleanedCount} expired items`);
      return cleanedCount;
    } catch (error) {
      console.error('[SecureStorage] Failed to cleanup expired items:', error);
      return 0;
    }
  }

  /**
   * Определение типа хранилища для ключа
   */
  private static getStorageType(key: string): Storage {
    // Используем sessionStorage для более чувствительных данных
    const sessionStorageKeys = ['access_token', 'refresh_token', 'token_metadata'];
    
    if (sessionStorageKeys.some(sensitiveKey => key.includes(sensitiveKey))) {
      return sessionStorage;
    }
    
    return localStorage;
  }

  /**
   * Простое шифрование (в продакшене использовать Web Crypto API)
   */
  private static encrypt(text: string): string {
    try {
      // В продакшене заменить на реальное шифрование
      return btoa(encodeURIComponent(text + this.ENCRYPTION_KEY));
    } catch (error) {
      console.error('[SecureStorage] Encryption failed:', error);
      return text; // Fallback to plain text
    }
  }

  /**
   * Простая расшифровка
   */
  private static decrypt(encryptedText: string): string {
    try {
      const decoded = decodeURIComponent(atob(encryptedText));
      return decoded.substring(0, decoded.length - this.ENCRYPTION_KEY.length);
    } catch (error) {
      console.error('[SecureStorage] Decryption failed:', error);
      return encryptedText; // Fallback to encrypted text
    }
  }

  /**
   * Проверка поддержки Web Storage
   */
  static isSupported(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверка доступного места в хранилище
   */
  static getStorageQuota(): { used: number; available: number; total: number } {
    try {
      const test = 'a'.repeat(1024); // 1KB
      let used = 0;
      let available = 0;

      // Приблизительный расчет используемого места
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += new Blob([key + value]).size;
          }
        }
      }

      // Тестируем доступное место
      try {
        let i = 0;
        while (i < 10000) { // Максимум 10MB для теста
          localStorage.setItem(`__quota_test_${i}__`, test);
          available += 1024;
          i++;
        }
      } catch (quotaError) {
        // Достигли лимита
      } finally {
        // Очищаем тестовые данные
        for (let j = 0; j < 10000; j++) {
          localStorage.removeItem(`__quota_test_${j}__`);
        }
      }

      return {
        used,
        available,
        total: used + available
      };
    } catch (error) {
      console.error('[SecureStorage] Failed to get storage quota:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}

// Автоматическая очистка устаревших элементов при загрузке
if (typeof window !== 'undefined') {
  // Очищаем при загрузке страницы
  setTimeout(() => {
    SecureStorage.cleanupExpired();
  }, 1000);

  // Очищаем каждые 10 минут
  setInterval(() => {
    SecureStorage.cleanupExpired();
  }, 10 * 60 * 1000);
}

export default SecureStorage;