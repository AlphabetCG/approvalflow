// F-04: GET /api/reviews/queue. F-08: category / from / to filters, no status (D-25).
import { Router } from "express";
import { requireRole } from "../auth/middleware";
import { badRequest } from "../http";
import { listQueue } from "../requests/decide";
import { parseRequestFilters } from "../requests/filters";

export const reviewsRouter = Router();

reviewsRouter.get("/queue", requireRole("REVIEWER"), async (req, res) => {
  const filters = parseRequestFilters(req.query as Record<string, unknown>, { allowStatus: false });
  if (!filters.ok) throw badRequest(filters.errors.map((e) => e.message).join("; "), filters.errors);
  res.json({ requests: await listQueue(req.user!.id, filters.value) });
});
