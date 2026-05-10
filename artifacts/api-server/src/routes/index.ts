import { Router, type IRouter } from "express";
import healthRouter from "./health";
import athletesRouter from "./athletes";
import kicksRouter from "./kicks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(athletesRouter);
router.use(kicksRouter);

export default router;
