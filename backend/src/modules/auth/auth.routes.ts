import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSession } from "../../middleware/session.js";
import { logout, me, requestOtp, verifyOtp } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/otp/request", asyncHandler(requestOtp));
authRouter.post("/otp/verify", asyncHandler(verifyOtp));
authRouter.post("/logout", asyncHandler(logout));
authRouter.get("/me", requireSession, asyncHandler(me));
