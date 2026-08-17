import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 1, openId: `${role}-test`, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("admin access", () => {
  it("rejects project creation for regular users", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.projects.create({ title: "مشروع تجريبي", description: "وصف طويل لمشروع تجريبي", year: "2025", icon: "fa-code", tech: "React", sortOrder: 0 })).rejects.toThrow("Admin access required");
  });

  it("allows an admin to read the project list", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.projects.list()).resolves.toBeInstanceOf(Array);
  });
});

describe("message input", () => {
  it("rejects malformed contact messages before persistence", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.messages.create({ name: "A", email: "not-an-email", subject: "", message: "" })).rejects.toThrow();
  });
});
