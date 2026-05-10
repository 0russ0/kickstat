import { db, kicksTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Router } from "express";
import { CreateKickBody } from "@workspace/api-zod";

const router = Router();

router.get("/kicks/stats/:athleteId", async (req, res) => {
  const { athleteId } = req.params;
  const allKicks = await db
    .select()
    .from(kicksTable)
    .where(eq(kicksTable.athleteId, athleteId));

  const fgKicks = allKicks.filter((k) => k.kickType === "field_goal");
  const puntKicks = allKicks.filter((k) => k.kickType === "punt");
  const kickoffKicks = allKicks.filter((k) => k.kickType === "kickoff");
  const puntWithDist = puntKicks.filter(
    (k) => (k.data as Record<string, unknown>)["distance"] != null,
  );

  res.json({
    athleteId,
    totalKicks: allKicks.length,
    fieldGoals: {
      total: fgKicks.length,
      made: fgKicks.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made").length,
      missed: fgKicks.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "missed").length,
    },
    punts: {
      total: puntKicks.length,
      avgDistance: puntWithDist.length
        ? puntWithDist.reduce((s, k) => s + ((k.data as Record<string, unknown>)["distance"] as number), 0) / puntWithDist.length
        : 0,
      avgHangtime: puntKicks.length
        ? puntKicks.reduce((s, k) => s + ((k.data as Record<string, unknown>)["hangtime"] as number), 0) / puntKicks.length
        : 0,
    },
    kickoffs: {
      total: kickoffKicks.length,
      touchbacks: kickoffKicks.filter((k) => (k.data as Record<string, unknown>)["touchback"]).length,
      avgHangtime: kickoffKicks.length
        ? kickoffKicks.reduce((s, k) => s + ((k.data as Record<string, unknown>)["hangtime"] as number), 0) / kickoffKicks.length
        : 0,
    },
  });
});

router.get("/kicks", async (req, res) => {
  const { athleteId, kickType, gameId, practiceOnly, practiceSessionId, limit } = req.query;
  const conditions = [];

  if (athleteId && typeof athleteId === "string") conditions.push(eq(kicksTable.athleteId, athleteId));
  if (kickType && typeof kickType === "string") conditions.push(eq(kicksTable.kickType, kickType as "field_goal" | "punt" | "kickoff"));
  if (gameId && typeof gameId === "string") conditions.push(eq(kicksTable.gameId, gameId));
  if (practiceSessionId && typeof practiceSessionId === "string") conditions.push(eq(kicksTable.practiceSessionId, practiceSessionId));
  if (practiceOnly === "true") conditions.push(isNull(kicksTable.gameId));

  const limitN = limit ? parseInt(limit as string, 10) : 10;

  const kicks = await db
    .select()
    .from(kicksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(kicksTable.createdAt))
    .limit(isNaN(limitN) ? 10 : limitN);

  res.json(
    kicks.map((k) => ({
      id: k.id,
      athleteId: k.athleteId,
      gameId: k.gameId ?? null,
      practiceSessionId: k.practiceSessionId ?? null,
      kickType: k.kickType,
      data: k.data,
      isGameWinner: k.isGameWinner,
      createdAt: k.createdAt,
    })),
  );
});

router.post("/kicks", async (req, res) => {
  const parsed = CreateKickBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [kick] = await db
    .insert(kicksTable)
    .values({
      athleteId: parsed.data.athleteId,
      gameId: parsed.data.gameId ?? null,
      practiceSessionId: (parsed.data as Record<string, unknown>)["practiceSessionId"] as string ?? null,
      kickType: parsed.data.kickType,
      data: parsed.data.data,
      isGameWinner: parsed.data.isGameWinner ?? false,
    })
    .returning();

  res.status(201).json({
    id: kick.id,
    athleteId: kick.athleteId,
    gameId: kick.gameId ?? null,
    practiceSessionId: kick.practiceSessionId ?? null,
    kickType: kick.kickType,
    data: kick.data,
    isGameWinner: kick.isGameWinner,
    createdAt: kick.createdAt,
  });
});

router.patch("/kicks/:id", async (req, res) => {
  const { id } = req.params;
  const { data, isGameWinner } = req.body as { data?: unknown; isGameWinner?: boolean };
  if (!data) {
    res.status(400).json({ error: "data is required" });
    return;
  }
  const updateFields: Record<string, unknown> = { data };
  if (typeof isGameWinner === "boolean") updateFields["isGameWinner"] = isGameWinner;
  const [updated] = await db
    .update(kicksTable)
    .set(updateFields)
    .where(eq(kicksTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Kick not found" });
    return;
  }
  res.json({
    id: updated.id,
    athleteId: updated.athleteId,
    gameId: updated.gameId ?? null,
    practiceSessionId: updated.practiceSessionId ?? null,
    kickType: updated.kickType,
    data: updated.data,
    isGameWinner: updated.isGameWinner,
    createdAt: updated.createdAt,
  });
});

router.delete("/kicks/:id", async (req, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(kicksTable)
    .where(eq(kicksTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Kick not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
