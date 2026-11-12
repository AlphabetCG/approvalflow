import { Router } from "express";
import { decisionsRouter } from "./decisions";
import { requestsRouter } from "./requests";
import { reviewsRouter } from "./reviews";

// Every feature adds its own router file in this folder and mounts it here,
// one line per feature, so parallel branches rarely conflict:
//   apiRouter.use("/requests", requestsRouter); // F-02, F-03, F-04
//   apiRouter.use("/reviews", reviewsRouter);   // F-04
// Exception: /api/auth (F-01) is mounted in app.ts, because it needs the config.
export const apiRouter = Router();

apiRouter.use("/requests", requestsRouter); // F-02
apiRouter.use("/requests", decisionsRouter); // F-04: /:id/approve, /:id/reject
apiRouter.use("/reviews", reviewsRouter); // F-04: /queue
