import { Router } from "express";
import * as controller from "../controllers/trip.controller";
import * as checklistController from "../controllers/checklist.controller";
import * as malariaPlanController from "../controllers/malariaPlan.controller";
import * as reminderController from "../controllers/reminder.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  createTripSchema,
  updateTripSchema,
  updateTripPreparationSchema,
  tripIdParamSchema,
  checklistUpdateSchema,
} from "../validators/tripValidators";
import { saveMalariaPlanSchema } from "../validators/malariaPlanValidators";

const router = Router();

router.use(requireAuth);

router.get("/", controller.listTrips);
router.post("/", validate({ body: createTripSchema }), controller.createTrip);
router.get("/:id", validate({ params: tripIdParamSchema }), controller.getTrip);
router.put(
  "/:id",
  validate({ params: tripIdParamSchema, body: updateTripSchema }),
  controller.updateTrip,
);
router.delete("/:id", validate({ params: tripIdParamSchema }), controller.deleteTrip);

// The trip dashboard: destination + checklist + malaria plan + reminders + stories +
// readiness, aggregated in one call so the dashboard page doesn't need to orchestrate
// five separate requests on the client.
router.get(
  "/:id/dashboard",
  validate({ params: tripIdParamSchema }),
  controller.getTripDashboard,
);

router.put(
  "/:id/preparation",
  validate({ params: tripIdParamSchema, body: updateTripPreparationSchema }),
  controller.updateTripPreparation,
);

router.get(
  "/:id/checklist/template",
  validate({ params: tripIdParamSchema }),
  checklistController.getTripChecklistTemplate,
);
router.get(
  "/:id/checklist",
  validate({ params: tripIdParamSchema }),
  checklistController.getTripChecklist,
);
router.put(
  "/:id/checklist",
  validate({ params: tripIdParamSchema, body: checklistUpdateSchema }),
  checklistController.putTripChecklist,
);

// Malaria plan — belongs to a trip. GET returns null (not 404) when no plan exists yet, since
// "no plan" is a normal, expected trip state, not an error.
router.get(
  "/:id/malaria-plan",
  validate({ params: tripIdParamSchema }),
  malariaPlanController.getMalariaPlan,
);
router.put(
  "/:id/malaria-plan",
  validate({ params: tripIdParamSchema, body: saveMalariaPlanSchema }),
  malariaPlanController.saveMalariaPlan,
);
router.delete(
  "/:id/malaria-plan",
  validate({ params: tripIdParamSchema }),
  malariaPlanController.deleteMalariaPlan,
);

router.get(
  "/:id/reminders",
  validate({ params: tripIdParamSchema }),
  reminderController.getReminders,
);
router.get(
  "/:id/calendar.ics",
  validate({ params: tripIdParamSchema }),
  reminderController.getTripCalendar,
);

export default router;
