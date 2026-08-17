import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createContactMessage: vi.fn().mockResolvedValue(7),
  createProject: vi.fn().mockResolvedValue(8),
  deleteContactMessage: vi.fn().mockResolvedValue(true),
  deleteProject: vi.fn().mockResolvedValue(true),
  listContactMessages: vi.fn().mockResolvedValue([]),
  listProjects: vi.fn().mockResolvedValue([]),
  updateContactStatus: vi.fn().mockResolvedValue(true),
  updateProject: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  const now = new Date();
  return { user: { id: 1, openId: "admin", email: "admin@example.com", name: "Admin", loginMethod: "test", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

const project = { title: "نظام جديد", description: "وصف مفصل لنظام جديد", year: "2026", icon: "fa-code", tech: "React, SQL", liveUrl: null, githubUrl: null, sortOrder: 1 };

describe("contact message persistence", () => {
  it("accepts a valid contact message", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.messages.create({ name: "زائر الموقع", email: "visitor@example.com", subject: "استفسار", message: "أرغب في معرفة تفاصيل المشروع." })).resolves.toBe(7);
  });
});

describe("admin operations", () => {
  it("updates and removes a message", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.messages.setStatus({ id: 4, status: "read" })).resolves.toBe(true);
    await expect(caller.messages.remove({ id: 4 })).resolves.toBe(true);
  });

  it("creates, updates, and removes a project", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.projects.create(project)).resolves.toBe(8);
    await expect(caller.projects.update({ ...project, id: 8, title: "نظام محدث" })).resolves.toBe(true);
    await expect(caller.projects.remove({ id: 8 })).resolves.toBe(true);
  });
});
