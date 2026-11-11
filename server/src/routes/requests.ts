// F-02: POST /api/requests
import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { HttpError } from "../http";

export const requestsRouter = Router();

// Stub until the implementation commit: the F-02 tests must fail on their assertions.
requestsRouter.post("/", requireAuth, () => {
  throw new HttpError(501, "NOT_IMPLEMENTED", "Not implemented yet");
});
