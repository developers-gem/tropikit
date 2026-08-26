import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
} from "../validators/authValidators";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validate({ body: registerSchema }), controller.register);
router.post("/login", validate({ body: loginSchema }), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword,
);
router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  controller.resetPassword,
);

router.get("/me", requireAuth, controller.me);
router.put(
  "/profile",
  requireAuth,
  validate({ body: updateProfileSchema }),
  controller.updateProfile,
);
router.put(
  "/preferences",
  requireAuth,
  validate({ body: updatePreferencesSchema }),
  controller.updatePreferences,
);
router.put(
  "/password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);
router.delete(
  "/account",
  requireAuth,
  validate({ body: deleteAccountSchema }),
  controller.deleteAccount,
);

export default router;
