import { Router } from "express";
import { requestsRouter } from "./requests";

// Every feature adds its own router file in this folder and mounts it here,
// one line per feature, so parallel branches rarely conflict:
//   apiRouter.use("/auth", authRouter);         // F-01
//   apiRouter.use("/requests", requestsRouter); // F-02, F-03, F-04
//   apiRouter.use("/reviews", reviewsRouter);   // F-04
export const apiRouter = Router();

apiRouter.use("/requests", requestsRouter); // F-02
