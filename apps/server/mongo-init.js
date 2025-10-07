// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Create database and collections
db = db.getSiblingDB("payments_db");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "password"],
      properties: {
        username: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "must be a valid email address and is required",
        },
        password: {
          bsonType: "string",
          minLength: 6,
          description:
            "must be a string with minimum length of 6 and is required",
        },
      },
    },
  },
});

db.createCollection("payments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["amount", "currency", "userId"],
      properties: {
        amount: {
          bsonType: "number",
          minimum: 0,
          description: "must be a positive number and is required",
        },
        currency: {
          enum: ["ILS", "USD", "EUR"],
          description: "must be one of the allowed currencies and is required",
        },
        userId: {
          bsonType: "objectId",
          description: "must be a valid user ID and is required",
        },
      },
    },
  },
});

db.createCollection("admins", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "password", "role"],
      properties: {
        username: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        password: {
          bsonType: "string",
          minLength: 6,
          description:
            "must be a string with minimum length of 6 and is required",
        },
        role: {
          enum: ["admin", "super_admin"],
          description: "must be one of the allowed roles and is required",
        },
      },
    },
  },
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.payments.createIndex({ userId: 1 });
db.payments.createIndex({ createdAt: -1 });
db.admins.createIndex({ username: 1 }, { unique: true });

// Create default admin user (password will be hashed by the application)
db.admins.insertOne({
  username: "admin",
  password: "admin123", // This will be hashed by bcrypt in the application
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create sample data for testing
db.users.insertMany([
  {
    username: "testuser1",
    email: "test1@example.com",
    password: "password123",
    firstName: "ישראל",
    lastName: "כהן",
    phone: "050-1234567",
    apartment: "1",
    role: "resident",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: "testuser2",
    email: "test2@example.com",
    password: "password123",
    firstName: "שרה",
    lastName: "לוי",
    phone: "050-7654321",
    apartment: "2",
    role: "resident",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Create sample payments
db.payments.insertMany([
  {
    userId: db.users.findOne({ username: "testuser1" })._id,
    amount: 1500,
    currency: "ILS",
    paymentMethod: "credit_card",
    status: "completed",
    description: "תשלום דמי ועד בית",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: db.users.findOne({ username: "testuser2" })._id,
    amount: 1200,
    currency: "ILS",
    paymentMethod: "bank_transfer",
    status: "pending",
    description: "תשלום שכירות",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print("MongoDB initialization completed successfully!");
print("Database: payments_db");
print("Collections created: users, payments, admins");
print("Indexes created for better performance");
print("Default admin user created: admin/admin123");
print("Sample data inserted for testing");
