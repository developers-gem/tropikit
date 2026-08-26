import { Router } from "express";
import * as controller from "../controllers/story.controller";

const router = Router();

router.get("/", controller.getStories);
router.get("/:id", controller.getStoryById);

export default router;
