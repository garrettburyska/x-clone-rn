import mongoose from 'mongoose';
import { connectDB } from '../../config/db.js';

// Mock mongoose and ENV
jest.mock('mongoose');
jest.mock('../../config/env.js', () => ({
  ENV: {
    MONGO_URI: 'mongodb://localhost:27017/testdb',
  },
}));

describe('Database Configuration', () => {
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('connectDB function', () => {
    test('should successfully connect to MongoDB', async () => {
      mongoose.connect.mockResolvedValue();

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected to MONGODB successfully ✅');
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should use ENV.MONGO_URI for connection', async () => {
      mongoose.connect.mockResolvedValue();

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    });

    test('should handle network timeout errors', async () => {
      const timeoutError = new Error('Server selection timed out');
      timeoutError.name = 'MongooseServerSelectionError';
      mongoose.connect.mockRejectedValue(timeoutError);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      authError.name = 'MongooseAuthenticationError';
      mongoose.connect.mockRejectedValue(authError);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid connection string errors', async () => {
      const invalidError = new Error('Invalid connection string');
      mongoose.connect.mockRejectedValue(invalidError);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should exit process with code 1 on error', async () => {
      mongoose.connect.mockRejectedValue(new Error('Any error'));

      await connectDB();

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should be an async function', () => {
      expect(connectDB.constructor.name).toBe('AsyncFunction');
    });

    test('should return a promise', () => {
      mongoose.connect.mockResolvedValue();
      const result = connectDB();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Error handling edge cases', () => {
    test('should handle undefined error object', async () => {
      mongoose.connect.mockRejectedValue(undefined);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle null error object', async () => {
      mongoose.connect.mockRejectedValue(null);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle string error', async () => {
      mongoose.connect.mockRejectedValue('Connection string error');

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle error with custom properties', async () => {
      const customError = new Error('Custom error');
      customError.code = 'ECONNREFUSED';
      customError.errno = -111;
      mongoose.connect.mockRejectedValue(customError);

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith('Error connecting to MONGODB');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});