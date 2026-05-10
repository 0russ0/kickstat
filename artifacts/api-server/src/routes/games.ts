import { db, gamesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { CreateGameBody, UpdateGameBody } from "@workspace/api-zod";

const router = Router();

router.get("/games", async (req, res) => {
  const { seasonId, athleteId } = req.query;
  const conditions = [];
  if (seasonId && typeof seasonId === "string") conditions.push(eq(gamesTable.seasonId, seasonId));
  if (athleteId && typeof athleteId === "string") conditions.push(eq(gamesTable.athleteId, athleteId));
  const games = await db
    .select()
    .from(gamesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(gamesTable.date));
  res.json(games);
});

router.post("/games", async (req, res) => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [game] = await db.insert(gamesTable).values({
    seasonId: parsed.data.seasonId,
    athleteId: parsed.data.athleteId,
    opponent: parsed.data.opponent ?? null,
    date: parsed.data.date,
    homeAway: parsed.data.homeAway,
    surface: parsed.data.surface,
    weather: parsed.data.weather ?? null,
    isPlayoff: parsed.data.isPlayoff ?? false,
  }).returning();
  res.status(201).json(game);
});

router.patch("/games/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = UpdateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if ("myScore" in parsed.data) updateData["myScore"] = parsed.data.myScore;
  if ("opponentScore" in parsed.data) updateData["opponentScore"] = parsed.data.opponentScore;
  if ("opponent" in parsed.data) updateData["opponent"] = parsed.data.opponent;

  const [updated] = await db
    .update(gamesTable)
    .set(updateData)
    .where(eq(gamesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(updated);
});

router.delete("/games/:id", async (req, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(gamesTable)
    .where(eq(gamesTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
