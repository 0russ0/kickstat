import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { athletesTable } from "./athletes";

export const practiceSessionsTable = pgTable("practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPracticeSessionSchema = createInsertSchema(practiceSessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessionsTable.$inferSelect;
