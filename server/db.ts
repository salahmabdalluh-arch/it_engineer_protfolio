import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { contactMessages, InsertUser, projects, Project, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? 'admin'; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

const defaults: Array<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> = [
  { title: 'متجر إلكتروني متكامل', description: 'منصة تجارة إلكترونية عصرية لإدارة المنتجات والطلبات وتجربة شراء سلسة.', year: '2025', icon: 'fa-cart-shopping', tech: 'React, Node.js, MySQL', liveUrl: null, githubUrl: null, sortOrder: 1 },
  { title: 'نظام إدارة الفنادق', description: 'نظام مؤسسي لإدارة الحجوزات والغرف والنزلاء والتقارير التشغيلية.', year: '2024', icon: 'fa-hotel', tech: 'PHP, Oracle APEX, SQL', liveUrl: null, githubUrl: null, sortOrder: 2 },
  { title: 'نظام إدارة المدارس', description: 'منصة متكاملة للطلاب والمعلمين والجداول والدرجات والتقارير المدرسية.', year: '2025', icon: 'fa-school', tech: 'Java, Oracle DB, JavaScript', liveUrl: null, githubUrl: null, sortOrder: 3 },
];

export async function ensureDefaultProjects() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: projects.id }).from(projects).limit(1);
  if (existing.length === 0) await db.insert(projects).values(defaults);
}

export async function listProjects() {
  await ensureDefaultProjects();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function createProject(input: typeof projects.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  const result = await db.insert(projects).values(input);
  return Number(result[0].insertId);
}

export async function updateProject(id: number, input: Partial<typeof projects.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  await db.update(projects).set(input).where(eq(projects.id, id));
  return true;
}

export async function deleteProject(id: number) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  await db.delete(projects).where(eq(projects.id, id));
  return true;
}

export async function createContactMessage(input: typeof contactMessages.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  const result = await db.insert(contactMessages).values(input);
  return Number(result[0].insertId);
}

export async function listContactMessages(status?: 'read' | 'unread') {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contactMessages).where(status ? eq(contactMessages.status, status) : undefined).orderBy(desc(contactMessages.createdAt));
}

export async function updateContactStatus(id: number, status: 'read' | 'unread') {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return true;
}

export async function deleteContactMessage(id: number) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  return true;
}
