/**
 * Jest Setup for Server
 * Construction Master App - Backend Test Environment
 */

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.MONGODB_URI = "mongodb://localhost:27017/probuilder-test";
process.env.PORT = "3001";

// Mock console methods in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning:") || args[0].includes("DeprecationWarning:"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("DeprecationWarning:")
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

