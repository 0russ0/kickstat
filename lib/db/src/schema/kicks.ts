import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { athletesTable } from "./athletes";
import { gamesTable } from "./games";

export const kicksTable = pgTable("kicks", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletesTable.id, { onDelete: "cascade" }),
  gameId: uuid("game_id").references(() => gamesTable.id, { onDelete: "set null" }),
  kickType: text("kick_type", {
    enum: ["field_goal", "punt", "kickoff"],
  }).notNull(),
  data: jsonb("data").notNull(),
  isGameWinner: boolean("is_game_winner").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKickSchema = createInsertSchema(kicksTable).omit({
  id: true,
  createdAt: true,
});

export type InsertKick = z.infer<typeof insertKickSchema>;
export type Kick = typeof kicksTable.$inferSelect;
