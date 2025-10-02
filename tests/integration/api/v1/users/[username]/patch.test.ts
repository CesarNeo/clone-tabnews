import { test, beforeAll, expect, describe } from "@jest/globals";
import password from "models/password";
import user from "models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/:username", () => {
  describe("Anonymous user", () => {
    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/example_nonexistent_username",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique o username e tente novamente.",
        status_code: 404,
      });
    });
    test("With duplicate username", async () => {
      await orchestrator.createUser({ username: "duplicate_username1" });
      await orchestrator.createUser({ username: "duplicate_username2" });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/duplicate_username2",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "duplicate_username1",
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O nome de usuário já está sendo usado por outro usuário.",
        action: "Utilize outro nome de usuário para está operação.",
        status_code: 400,
      });
    });
    test("With duplicate email", async () => {
      await orchestrator.createUser({ email: "email1@example.com" });
      const createdUser2 = await orchestrator.createUser({
        email: "email2@example.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email já está sendo usado por outro usuário.",
        action: "Utilize outro email para está operação.",
        status_code: 400,
      });
    });
    test("With unique username", async () => {
      await orchestrator.createUser({
        username: "unique_username",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/unique_username",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "unique_username_updated",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique_username_updated",
        email: responseBody.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique email", async () => {
      const userResponse = await orchestrator.createUser({
        email: "unique_email@example.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userResponse.username}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unique_email_updated@example.com",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userResponse.username,
        email: "unique_email_updated@example.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With new password", async () => {
      const userResponse = await orchestrator.createUser({
        password: "secure_password",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userResponse.username}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "new_secure_password",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userResponse.username,
        email: userResponse.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        userResponse.username,
      );
      const correctPasswordMatch = await password.compare(
        "new_secure_password",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "secure_password",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
