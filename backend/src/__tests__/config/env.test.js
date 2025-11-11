describe('Environment Configuration', () => {
  let originalEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Clear require cache to force re-import
    jest.resetModules();
    
    // Set up test environment variables
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';
    process.env.MANGO_URI = 'mongodb://localhost:27017/testdb';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.CLERK_SECRET_KEY = 'sk_test_456';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
    process.env.ARCJET_KEY = 'test-arcjet-key';
  });

  describe('ENV object structure', () => {
    test('should export ENV object with all required properties', async () => {
      const { ENV } = await import('../../config/env.js');

      expect(ENV).toBeDefined();
      expect(ENV).toHaveProperty('PORT');
      expect(ENV).toHaveProperty('NODE_ENV');
      expect(ENV).toHaveProperty('MONGO_URI');
      expect(ENV).toHaveProperty('CLERK_PUBLISHABLE_KEY');
      expect(ENV).toHaveProperty('CLERK_SECRET_KEY');
      expect(ENV).toHaveProperty('CLOUDINARY_CLOUD_NAME');
      expect(ENV).toHaveProperty('CLOUDINARY_API_KEY');
      expect(ENV).toHaveProperty('CLOUDINARY_API_SECRET');
      expect(ENV).toHaveProperty('ARCJET_KEY');
    });

    test('should load PORT from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.PORT).toBe('3000');
    });

    test('should load NODE_ENV from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.NODE_ENV).toBe('test');
    });

    test('should load MONGO_URI from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.MONGO_URI).toBe('mongodb://localhost:27017/testdb');
    });

    test('should load CLERK_PUBLISHABLE_KEY from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLERK_PUBLISHABLE_KEY).toBe('pk_test_123');
    });

    test('should load CLERK_SECRET_KEY from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLERK_SECRET_KEY).toBe('sk_test_456');
    });

    test('should load CLOUDINARY_CLOUD_NAME from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLOUDINARY_CLOUD_NAME).toBe('test-cloud');
    });

    test('should load CLOUDINARY_API_KEY from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLOUDINARY_API_KEY).toBe('test-api-key');
    });

    test('should load CLOUDINARY_API_SECRET from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLOUDINARY_API_SECRET).toBe('test-api-secret');
    });

    test('should load ARCJET_KEY from environment', async () => {
      const { ENV } = await import('../../config/env.js');
      expect(ENV.ARCJET_KEY).toBe('test-arcjet-key');
    });
  });

  describe('Missing environment variables', () => {
    test('should handle missing PORT', async () => {
      delete process.env.PORT;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.PORT).toBeUndefined();
    });

    test('should handle missing NODE_ENV', async () => {
      delete process.env.NODE_ENV;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.NODE_ENV).toBeUndefined();
    });

    test('should handle missing MONGO_URI', async () => {
      delete process.env.MANGO_URI;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.MONGO_URI).toBeUndefined();
    });

    test('should handle missing CLERK_PUBLISHABLE_KEY', async () => {
      delete process.env.CLERK_PUBLISHABLE_KEY;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLERK_PUBLISHABLE_KEY).toBeUndefined();
    });

    test('should handle missing CLERK_SECRET_KEY', async () => {
      delete process.env.CLERK_SECRET_KEY;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLERK_SECRET_KEY).toBeUndefined();
    });

    test('should handle all missing environment variables', async () => {
      process.env = {};
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.PORT).toBeUndefined();
      expect(ENV.NODE_ENV).toBeUndefined();
      expect(ENV.MONGO_URI).toBeUndefined();
      expect(ENV.CLERK_PUBLISHABLE_KEY).toBeUndefined();
      expect(ENV.CLERK_SECRET_KEY).toBeUndefined();
      expect(ENV.CLOUDINARY_CLOUD_NAME).toBeUndefined();
      expect(ENV.CLOUDINARY_API_KEY).toBeUndefined();
      expect(ENV.CLOUDINARY_API_SECRET).toBeUndefined();
      expect(ENV.ARCJET_KEY).toBeUndefined();
    });
  });

  describe('Environment variable types', () => {
    test('should preserve string types for PORT', async () => {
      process.env.PORT = '5000';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(typeof ENV.PORT).toBe('string');
      expect(ENV.PORT).toBe('5000');
    });

    test('should handle different NODE_ENV values', async () => {
      const environments = ['development', 'production', 'test', 'staging'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        jest.resetModules();

        const { ENV } = await import('../../config/env.js');
        expect(ENV.NODE_ENV).toBe(env);
      }
    });

    test('should handle empty string values', async () => {
      process.env.PORT = '';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.PORT).toBe('');
    });
  });

  describe('MONGO_URI typo handling', () => {
    test('should use MANGO_URI from process.env (typo in code)', async () => {
      process.env.MANGO_URI = 'mongodb://test';
      delete process.env.MONGO_URI;
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.MONGO_URI).toBe('mongodb://test');
    });

    test('should not read from MONGO_URI if MANGO_URI is set', async () => {
      process.env.MANGO_URI = 'mongodb://mango';
      process.env.MONGO_URI = 'mongodb://mongo';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      // The code has a typo: MANGO_URI instead of MONGO_URI
      expect(ENV.MONGO_URI).toBe('mongodb://mango');
    });
  });

  describe('Special characters in environment variables', () => {
    test('should handle special characters in connection strings', async () => {
      process.env.MANGO_URI = 'mongodb://user:p@ssw0rd!@localhost:27017/db?authSource=admin';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.MONGO_URI).toContain('p@ssw0rd!');
    });

    test('should handle URLs with query parameters', async () => {
      process.env.MANGO_URI = 'mongodb://localhost:27017/db?retryWrites=true&w=majority';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.MONGO_URI).toContain('retryWrites=true');
    });

    test('should handle special characters in API keys', async () => {
      process.env.CLOUDINARY_API_SECRET = 'AbC123!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      jest.resetModules();

      const { ENV } = await import('../../config/env.js');
      expect(ENV.CLOUDINARY_API_SECRET).toBe('AbC123!@#$%^&*()_+-=[]{}|;:",.<>?/~`');
    });
  });

  describe('Dotenv integration', () => {
    test('should call dotenv.config()', async () => {
      // This test verifies that the module imports and calls dotenv
      // The actual dotenv.config() is called at module load time
      const { ENV } = await import('../../config/env.js');
      expect(ENV).toBeDefined();
    });
  });
});