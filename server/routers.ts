import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createContactMessage, createProject, deleteContactMessage, deleteProject, listContactMessages, listProjects, updateContactStatus, updateProject } from "./db";

const projectInput = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(4000),
  year: z.string().trim().min(4).max(8),
  icon: z.string().trim().min(2).max(64),
  tech: z.string().trim().min(2).max(1000),
  liveUrl: z.string().trim().max(500).nullable().optional(),
  githubUrl: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new Error('Admin access required');
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: router({
    list: publicProcedure.query(() => listProjects()),
    create: adminOnly.input(projectInput).mutation(({ input }) => createProject(input)),
    update: adminOnly.input(projectInput.extend({ id: z.number().int().positive() })).mutation(({ input }) => {
      const { id, ...values } = input; return updateProject(id, values);
    }),
    remove: adminOnly.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteProject(input.id)),
  }),
  messages: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().max(320), subject: z.string().trim().min(2).max(220), message: z.string().trim().min(5).max(8000) })).mutation(({ input }) => createContactMessage(input)),
    list: adminOnly.input(z.object({ status: z.enum(['read', 'unread']).optional() }).optional()).query(({ input }) => listContactMessages(input?.status)),
    setStatus: adminOnly.input(z.object({ id: z.number().int().positive(), status: z.enum(['read', 'unread']) })).mutation(({ input }) => updateContactStatus(input.id, input.status)),
    remove: adminOnly.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteContactMessage(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
