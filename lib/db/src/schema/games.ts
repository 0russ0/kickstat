import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { athletesTable } from "./athletes";
import { seasonsTable } from "./seasons";

export const gamesTable = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id")
    .notNull()
    .references(() => seasonsTable.id, { onDelete: "cascade" }),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletesTable.id, { onDelete: "cascade" }),
  opponent: text("opponent"),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  homeAway: text("home_away", { enum: ["home", "away"] }).notNull(),
  surface: text("surface", { enum: ["grass", "turf"] }).notNull(),
  weather: jsonb("weather"), // { conditions, windMph, windDir }
  isPlayoff: boolean("is_playoff").notNull().default(false),
  myScore: integer("my_score"),
  opponentScore: integer("opponent_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
