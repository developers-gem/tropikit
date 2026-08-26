// Runs once before any test file is loaded. Setting these here (rather than relying on a
// .env file) keeps the test suite self-contained and reproducible in any environment,
// including CI, without needing real secrets or a real database connection string.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-suite-secret-not-for-production-use";
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/unused-in-tests";
process.env.CLIENT_URL = "http://localhost:5173";
