import { db, kicksTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { CreateKickBody, GetKicksQueryParams } from "@workspace/api-zod";

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
      avgDistance:
        puntKicks.length
          ? puntKicks.reduce((s, k) => s + ((k.data as Record<string, unknown>)["distance"] as number), 0) / puntKicks.length
          : 0,
      avgHangtime:
        puntKicks.length
          ? puntKicks.reduce((s, k) => s + ((k.data as Record<string, unknown>)["hangtime"] as number), 0) / puntKicks.length
          : 0,
    },
    kickoffs: {
      total: kickoffKicks.length,
      touchbacks: kickoffKicks.filter((k) => (k.data as Record<string, unknown>)["touchback"]).length,
      avgHangtime:
        kickoffKicks.length
          ? kickoffKicks.reduce((s, k) => s + ((k.data as Record<string, unknown>)["hangtime"] as number), 0) / kickoffKicks.length
          : 0,
    },
  });
});

router.get("/kicks", async (req, res) => {
  const query = GetKicksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { athleteId, kickType, limit } = query.data;
  const conditions = [];

  if (athleteId) conditions.push(eq(kicksTable.athleteId, athleteId));
  if (kickType) conditions.push(eq(kicksTable.kickType, kickType));

  const kicks = await db
    .select()
    .from(kicksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(kicksTable.createdAt))
    .limit(limit ?? 10);

  res.json(
    kicks.map((k) => ({
      id: k.id,
      athleteId: k.athleteId,
      kickType: k.kickType,
      data: k.data,
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
      kickType: parsed.data.kickType,
      data: parsed.data.data,
    })
    .returning();

  res.status(201).json({
    id: kick.id,
    athleteId: kick.athleteId,
    kickType: kick.kickType,
    data: kick.data,
    createdAt: kick.createdAt,
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
