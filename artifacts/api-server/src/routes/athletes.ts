import { athletesTable, db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { CreateAthleteBody, UpdateAthleteBody } from "@workspace/api-zod";

const router = Router();

router.get("/athletes", async (req, res) => {
  const athletes = await db
    .select()
    .from(athletesTable)
    .orderBy(athletesTable.createdAt);

  res.json(
    athletes.map((a) => ({
      id: a.id,
      name: a.name,
      createdAt: a.createdAt,
    })),
  );
});

router.post("/athletes", async (req, res) => {
  const parsed = CreateAthleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db.select().from(athletesTable);
  if (existing.length >= 3) {
    res.status(400).json({ error: "Maximum 3 athletes allowed" });
    return;
  }

  const [athlete] = await db
    .insert(athletesTable)
    .values({ name: parsed.data.name })
    .returning();

  res.status(201).json({
    id: athlete.id,
    name: athlete.name,
    createdAt: athlete.createdAt,
  });
});

router.patch("/athletes/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = UpdateAthleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [updated] = await db
      .update(athletesTable)
      .set({ name: parsed.data.name })
      .where(eq(athletesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Athlete not found" });
      return;
    }
    res.json({ id: updated.id, name: updated.name, createdAt: updated.createdAt });
  } catch {
    res.status(404).json({ error: "Athlete not found" });
  }
});

router.delete("/athletes/:id", async (req, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(athletesTable)
    .where(eq(athletesTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Athlete not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
