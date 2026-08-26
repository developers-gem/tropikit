import { Router } from "express";
import * as controller from "../controllers/checklist.controller";

const router = Router();

router.get("/", controller.getChecklistTemplate);

export default router;
