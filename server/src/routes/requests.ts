// F-02: POST /api/requests. F-03: GET /api/requests/mine, GET /api/requests/:id
import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { badRequest, notFound } from "../http";
import { findReadableRequest, listMyRequests } from "../requests/read";
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

// Registered before "/:id", so "mine" is never read as an id.
requestsRouter.get("/mine", requireAuth, async (req, res) => {
  res.json({ requests: await listMyRequests(req.user!.id) });
});

// D-10: not yours and not found give the same 404, so existence is not revealed.
requestsRouter.get("/:id", requireAuth, async (req, res) => {
  const request = await findReadableRequest(req.user!.id, req.params.id as string);
  if (!request) throw notFound("Request not found");
  res.json(request);
});
