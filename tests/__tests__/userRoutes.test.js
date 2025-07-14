// __tests__/userRoutes.test.js


const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const User = require("../../models/usersmodel");
const { app, server, io } = require("../../index");

describe("User Authentication API", () => {
  const testEmail = "jestuser@example.com";
  const testPassword = "test123456";

  beforeAll(async () => {
    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });
  });

  afterAll(async () => {
    // Clean up test user
    try {
      await User.deleteOne({ email: testEmail });
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
    // Close server and socket.io
    if (io) {
      io.close();
    }
    if (server) {
      server.close();
    }
  });

  test("should return 500 if required fields are missing", async () => {
    const res = await request(app).post("/api/user/register").send({
      name: "Ram",
      email: testEmail,
      // password missing
    });

    expect(res.statusCode).toBe(500); // Current controller returns 500 for missing required fields
  });

  test("should register user successfully", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .field("name", "Ram Jest")
      .field("email", testEmail)
      .field("password", testPassword)
      .field("role", "student")
      .attach("profile_picture", path.join(__dirname, "test-assets/test.png"));

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  test("should not allow duplicate registration", async () => {
    // Register the user first
    await request(app)
      .post("/api/user/register")
      .field("name", "Ram Jest")
      .field("email", testEmail)
      .field("password", testPassword)
      .field("role", "student")
      .attach("profile_picture", path.join(__dirname, "test-assets/test.png"));

    // Try to register again with the same email
    const res = await request(app)
      .post("/api/user/register")
      .field("name", "Ram Jest")
      .field("email", testEmail)
      .field("password", testPassword)
      .field("role", "student")
      .attach("profile_picture", path.join(__dirname, "test-assets/test.png"));

    expect(res.statusCode).toBeGreaterThanOrEqual(400); // Should fail (400 or 409)
    expect(res.body.message).toMatch(/already exists|duplicate/i);
  });

  test("should login with correct credentials", async () => {
    // Register the user first
    await request(app)
      .post("/api/user/register")
      .field("name", "Ram Jest")
      .field("email", testEmail)
      .field("password", testPassword)
      .field("role", "student")
      .attach("profile_picture", path.join(__dirname, "test-assets/test.png"));

    // Now login
    const res = await request(app).post("/api/user/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("role");
    expect(res.body).toHaveProperty("id");
  });

  test("should not login with incorrect password", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: testEmail,
      password: "wrongpass",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("should not login with non-existent email", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "nonexistent@example.com",
      password: testPassword,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("should not login with missing email", async () => {
    const res = await request(app).post("/api/user/login").send({
      password: testPassword,
    });
    expect(res.statusCode).toBe(400); // Bad request due to missing email
  });

  test("should not login with missing password", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: testEmail,
    });
    expect(res.statusCode).toBe(400); // Bad request due to missing password
  });
});
