import { db, practiceSessionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/practice-sessions", async (req, res) => {
  const { athleteId } = req.query;
  if (!athleteId || typeof athleteId !== "string") {
    res.status(400).json({ error: "athleteId is required" });
    return;
  }
  const sessions = await db
    .select()
    .from(practiceSessionsTable)
    .where(eq(practiceSessionsTable.athleteId, athleteId))
    .orderBy(desc(practiceSessionsTable.date));
  res.json(sessions.map((s) => ({
    id: s.id,
    athleteId: s.athleteId,
    date: s.date,
    notes: s.notes ?? null,
    createdAt: s.createdAt,
  })));
});

router.post("/practice-sessions", async (req, res) => {
  const { athleteId, date, notes } = req.body as { athleteId?: string; date?: string; notes?: string | null };
  if (!athleteId || !date) {
    res.status(400).json({ error: "athleteId and date are required" });
    return;
  }
  const [session] = await db
    .insert(practiceSessionsTable)
    .values({ athleteId, date, notes: notes ?? null })
    .returning();
  res.status(201).json({
    id: session.id,
    athleteId: session.athleteId,
    date: session.date,
    notes: session.notes ?? null,
    createdAt: session.createdAt,
  });
});

router.patch("/practice-sessions/:id", async (req, res) => {
  const { id } = req.params;
  const { date, notes } = req.body as { date?: string; notes?: string | null };
  const updateFields: Record<string, unknown> = {};
  if (date) updateFields["date"] = date;
  if (notes !== undefined) updateFields["notes"] = notes ?? null;
  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [updated] = await db
    .update(practiceSessionsTable)
    .set(updateFields)
    .where(eq(practiceSessionsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Practice session not found" });
    return;
  }
  res.json({
    id: updated.id,
    athleteId: updated.athleteId,
    date: updated.date,
    notes: updated.notes ?? null,
    createdAt: updated.createdAt,
  });
});

router.delete("/practice-sessions/:id", async (req, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(practiceSessionsTable)
    .where(eq(practiceSessionsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Practice session not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
