import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { attachAdmin, requireAdmin } from "../../middleware/admin.js";
import {
  deleteHunter,
  getHunter,
  getHunterDay,
  health,
  listHunters,
  login,
  logout,
  me,
  overview,
  recalcNoFapStreaks,
  resetHunter,
  resetHunterDates,
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(attachAdmin);

adminRouter.post("/login", asyncHandler(login));
adminRouter.post("/logout", asyncHandler(logout));
adminRouter.get("/me", asyncHandler(me));

adminRouter.get("/overview", requireAdmin, asyncHandler(overview));
adminRouter.get("/hunters", requireAdmin, asyncHandler(listHunters));
adminRouter.get("/hunters/:id", requireAdmin, asyncHandler(getHunter));
adminRouter.get("/hunters/:id/days/:dateKey", requireAdmin, asyncHandler(getHunterDay));
adminRouter.post("/hunters/:id/reset", requireAdmin, asyncHandler(resetHunter));
adminRouter.post("/hunters/:id/reset-dates", requireAdmin, asyncHandler(resetHunterDates));
adminRouter.delete("/hunters/:id", requireAdmin, asyncHandler(deleteHunter));
adminRouter.post("/recalc-nofap-streaks", requireAdmin, asyncHandler(recalcNoFapStreaks));
adminRouter.get("/health", requireAdmin, asyncHandler(health));
