// F-04: GET /api/reviews/queue
import { Router } from "express";
import { requireRole } from "../auth/middleware";
import { listQueue } from "../requests/decide";

export const reviewsRouter = Router();

reviewsRouter.get("/queue", requireRole("REVIEWER"), async (req, res) => {
  res.json({ requests: await listQueue(req.user!.id) });
});
