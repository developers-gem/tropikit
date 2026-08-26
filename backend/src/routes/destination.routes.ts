import { Router } from "express";
import * as controller from "../controllers/destination.controller";
import { validate } from "../middleware/validate";
import {
  destinationListQuerySchema,
  destinationSlugParamSchema,
  malariaCalculateSchema,
} from "../validators/destinationValidators";

const router = Router();

router.get("/", validate({ query: destinationListQuerySchema }), controller.getDestinations);

router.post(
  "/malaria/calculate",
  validate({ body: malariaCalculateSchema }),
  controller.postMalariaCalculate,
);

router.get(
  "/:slug",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationBySlug,
);
router.get(
  "/:slug/advice",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationAdvice,
);
router.get(
  "/:slug/vaccines",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationVaccines,
);
router.get(
  "/:slug/malaria",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationMalaria,
);
router.get(
  "/:slug/emergency",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationEmergency,
);
router.get(
  "/:slug/stories",
  validate({ params: destinationSlugParamSchema }),
  controller.getDestinationStories,
);

export default router;
