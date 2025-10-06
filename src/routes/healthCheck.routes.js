import { Router } from "express";
import { healthCheck } from "../controllers/heakcheck.controler";

const router = Router()

router.route("/check-health").get(healthCheck)

export default router;