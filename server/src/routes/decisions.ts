// F-04: POST /api/requests/:id/approve and /api/requests/:id/reject
import { Router, type RequestHandler } from "express";
import { requireRole } from "../auth/middleware";
import { badRequest } from "../http";
import { decide } from "../requests/decide";
import { validateDecision } from "../requests/decision-validation";
import type { DecisionAction } from "../requests/transitions";

export const decisionsRouter = Router();

// Contract check order: 401 / 403 role (requireRole), 400 body, then decide()
// gives 404, 403 own request, 409.
const handle =
  (action: DecisionAction): RequestHandler =>
  async (req, res) => {
    const body = validateDecision(action, req.body);
    if (!body.ok) throw badRequest(body.errors.map((e) => e.message).join("; "), body.errors);
    res.json(await decide(req.user!.id, req.params.id as string, action, body.reason));
  };

decisionsRouter.post("/:id/approve", requireRole("REVIEWER"), handle("APPROVE"));
decisionsRouter.post("/:id/reject", requireRole("REVIEWER"), handle("REJECT"));
