import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Verify User Middleware

export const verifyUser = asyncHandler(async (req, _, next) => {
  try {
    // verify the user is authenticated or not

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // verify token

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // check if user exists

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Accesstoken, user not found");
    }

    // attach user to req object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid Accesstoken");
  }
});


