// F-04: GET /api/reviews/queue. STUB: real implementation follows the failing tests.
import { Router } from "express";
import { HttpError } from "../http";

export const reviewsRouter = Router();

reviewsRouter.get("/queue", () => {
  throw new HttpError(501, "NOT_IMPLEMENTED", "Not implemented yet");
});
