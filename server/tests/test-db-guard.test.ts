import { describe, expect, it } from "vitest";
import { assertTestDatabase } from "./setup/env";

const url = (host: string, db: string) => `postgresql://u:p@${host}:5433/${db}?schema=public`;

describe("assertTestDatabase", () => {
  it.each(["approvalflow_test", "test", "my_app_test"])("accepts the local database %s", (db) => {
    expect(() => assertTestDatabase(url("localhost", db), "")).not.toThrow();
  });

  it.each(["approvalflow", "latest", "contest_prod", "attestations", "test_prod", "approvalflow_testing"])(
    "refuses the database name %s",
    (db) => {
      expect(() => assertTestDatabase(url("localhost", db), "")).toThrow(/Refusing .* database/);
    },
  );

  it("accepts 127.0.0.1 and ::1", () => {
    expect(() => assertTestDatabase(url("127.0.0.1", "approvalflow_test"), "")).not.toThrow();
    expect(() => assertTestDatabase(url("[::1]", "approvalflow_test"), "")).not.toThrow();
  });

  it("refuses a remote host even when the name looks like a test database", () => {
    expect(() => assertTestDatabase(url("prod.example.com", "approvalflow_test"), "")).toThrow(
      /Refusing .* host "prod.example.com"/,
    );
  });

  it("accepts an extra host listed in TEST_DB_HOSTS", () => {
    expect(() => assertTestDatabase(url("db", "approvalflow_test"), "db, ci-postgres")).not.toThrow();
  });

  it("refuses when DATABASE_URL is missing", () => {
    expect(() => assertTestDatabase("", "")).toThrow(/DATABASE_URL is not set/);
  });
});
