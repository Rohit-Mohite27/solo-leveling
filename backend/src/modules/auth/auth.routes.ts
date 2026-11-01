import { Router } from "express";
import { requireSession } from "../../middleware/session.js";
import { logout, me, requestOtp, verifyOtp } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/otp/request", requestOtp);
authRouter.post("/otp/verify", verifyOtp);
authRouter.post("/logout", logout);
authRouter.get("/me", requireSession, me);
