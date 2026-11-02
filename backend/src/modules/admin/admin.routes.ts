import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { attachAdmin, requireAdmin } from "../../middleware/admin.js";
import {
  getHunter,
  health,
  listHunters,
  login,
  logout,
  me,
  overview,
  resetHunter,
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(attachAdmin);

adminRouter.post("/login", asyncHandler(login));
adminRouter.post("/logout", asyncHandler(logout));
adminRouter.get("/me", asyncHandler(me));

adminRouter.get("/overview", requireAdmin, asyncHandler(overview));
adminRouter.get("/hunters", requireAdmin, asyncHandler(listHunters));
adminRouter.get("/hunters/:id", requireAdmin, asyncHandler(getHunter));
adminRouter.post("/hunters/:id/reset", requireAdmin, asyncHandler(resetHunter));
adminRouter.get("/health", requireAdmin, asyncHandler(health));
