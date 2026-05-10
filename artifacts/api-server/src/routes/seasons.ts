import { db, seasonsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { CreateSeasonBody, UpdateSeasonBody } from "@workspace/api-zod";

const router = Router();

router.get("/seasons", async (req, res) => {
  const { athleteId } = req.query;
  if (!athleteId || typeof athleteId !== "string") {
    res.status(400).json({ error: "athleteId is required" });
    return;
  }
  const seasons = await db
    .select()
    .from(seasonsTable)
    .where(eq(seasonsTable.athleteId, athleteId))
    .orderBy(desc(seasonsTable.year));
  res.json(seasons);
});

router.post("/seasons", async (req, res) => {
  const parsed = CreateSeasonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [season] = await db.insert(seasonsTable).values(parsed.data).returning();
  res.status(201).json(season);
});

router.patch("/seasons/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = UpdateSeasonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [updated] = await db
      .update(seasonsTable)
      .set(parsed.data)
      .where(eq(seasonsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Season not found" });
      return;
    }
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Season not found" });
  }
});

router.delete("/seasons/:id", async (req, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(seasonsTable)
    .where(eq(seasonsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Season not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
