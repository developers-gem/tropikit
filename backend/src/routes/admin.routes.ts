import { Router } from "express";
import * as controller from "../controllers/admin.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { requireRole, requireAdmin, requireStaff } from "../middleware/rbac";
import {
  adminIdParamSchema,
  listDestinationsQuerySchema,
  updateDestinationContentSchema,
  setActiveSchema,
  updateDestinationReviewSchema,
  createStorySchema,
  updateStorySchema,
  setStoryPublishedSchema,
  updateStoryReviewSchema,
} from "../validators/adminValidators";

const router = Router();

// Every admin route requires a valid session first, then a role check. Ordering matters:
// requireAuth populates req.user, which requireRole needs.
router.use(requireAuth);

// Dashboard and source management: any staff role can view.
router.get("/dashboard", requireStaff, controller.getDashboard);
router.get("/sources", requireStaff, controller.listSources);

// Destinations: staff can view; content edits need admin or content-editor; activation
// (a structural, site-wide decision) is admin-only; review-status transitions need admin
// or reviewer specifically — an editor should not be the one marking their own work reviewed.
router.get(
  "/destinations",
  requireStaff,
  validate({ query: listDestinationsQuerySchema }),
  controller.listDestinations,
);
router.get(
  "/destinations/:id",
  requireStaff,
  validate({ params: adminIdParamSchema }),
  controller.getDestination,
);
router.put(
  "/destinations/:id/content",
  requireRole("admin", "content-editor"),
  validate({ params: adminIdParamSchema, body: updateDestinationContentSchema }),
  controller.updateDestinationContent,
);
router.put(
  "/destinations/:id/active",
  requireAdmin,
  validate({ params: adminIdParamSchema, body: setActiveSchema }),
  controller.setDestinationActive,
);
router.put(
  "/destinations/:id/review",
  requireRole("admin", "reviewer"),
  validate({ params: adminIdParamSchema, body: updateDestinationReviewSchema }),
  controller.updateDestinationReview,
);

// Stories: per spec, "Admin/editor" have full create/edit/publish rights; review-status
// transitions follow the same admin-or-reviewer split as destinations.
router.get("/stories", requireStaff, controller.listStories);
router.get(
  "/stories/:id",
  requireStaff,
  validate({ params: adminIdParamSchema }),
  controller.getStory,
);
router.post(
  "/stories",
  requireRole("admin", "content-editor"),
  validate({ body: createStorySchema }),
  controller.createStory,
);
router.put(
  "/stories/:id",
  requireRole("admin", "content-editor"),
  validate({ params: adminIdParamSchema, body: updateStorySchema }),
  controller.updateStory,
);
router.put(
  "/stories/:id/published",
  requireRole("admin", "content-editor"),
  validate({ params: adminIdParamSchema, body: setStoryPublishedSchema }),
  controller.setStoryPublished,
);
router.put(
  "/stories/:id/review",
  requireRole("admin", "reviewer"),
  validate({ params: adminIdParamSchema, body: updateStoryReviewSchema }),
  controller.updateStoryReview,
);
router.delete(
  "/stories/:id",
  requireAdmin,
  validate({ params: adminIdParamSchema }),
  controller.deleteStory,
);

export default router;
