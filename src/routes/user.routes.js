import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  ChangeCurrentPassword,
  GetCurrentUser,
  updateUserAvatar,
  updateCoverImage,
  UpdateAccountDetails,
   getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//sercured route

router.route("/logout").post(verifyUser, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/Change-Password").post(verifyUser , ChangeCurrentPassword);
router.route("/get-User").get(verifyUser , GetCurrentUser);
router.route("/update-account").patch(verifyUser , UpdateAccountDetails);
router.route("/avatar").patch(verifyUser , upload.single("avatar"), updateUserAvatar);
router.route("/cover-Image").patch(verifyUser , upload.single("coverImage"), updateCoverImage);
router.route("/c/:userName").get(verifyUser,  getUserChannelProfile)
router.route("/history").get(verifyUser,  getWatchHistory)

export default router;
