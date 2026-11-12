// F-04: POST /api/requests/:id/approve and /reject. STUB: real implementation follows the failing tests.
import { Router } from "express";
import { HttpError } from "../http";

export const decisionsRouter = Router();

const notImplemented = () => {
  throw new HttpError(501, "NOT_IMPLEMENTED", "Not implemented yet");
};

decisionsRouter.post("/:id/approve", notImplemented);
decisionsRouter.post("/:id/reject", notImplemented);
