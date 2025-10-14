import { Router } from "express";
import {toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos} from  "../controllers/likes.controller.js";

import { verifyUser } from "../middlewares/auth.middleware.js";

const router =  Router();

router.use(verifyUser)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos);

export default router