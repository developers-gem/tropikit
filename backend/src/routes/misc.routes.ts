import { Router } from "express";
import * as controller from "../controllers/misc.controller";

const router = Router();

router.get("/emergency/global", controller.getGlobalEmergencyContacts);
router.get("/sources", controller.getSources);

export default router;
