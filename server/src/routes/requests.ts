// F-02: POST /api/requests
import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { badRequest } from "../http";
import { submitRequest } from "../requests/submit";
import { validateSubmitRequest } from "../requests/validation";

export const requestsRouter = Router();

requestsRouter.post("/", requireAuth, async (req, res) => {
  const result = validateSubmitRequest(req.body);
  if (!result.ok) {
    throw badRequest(result.errors.map((e) => e.message).join("; "), result.errors);
  }
  // The requester is always the signed-in user, never a value from the body.
  res.status(201).json(await submitRequest(req.user!, result.value));
});
