import { Router, type IRouter } from "express";
import healthRouter from "./health";
import athletesRouter from "./athletes";
import seasonsRouter from "./seasons";
import gamesRouter from "./games";
import practiceSessionsRouter from "./practice-sessions";
import kicksRouter from "./kicks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(athletesRouter);
router.use(seasonsRouter);
router.use(gamesRouter);
router.use(practiceSessionsRouter);
router.use(kicksRouter);

export default router;
