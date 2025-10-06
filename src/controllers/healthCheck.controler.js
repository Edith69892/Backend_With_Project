import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const healthCheck = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "user not found.");
  }

  return res.status(200).json(new ApiResponse(200, { username: user.username, email: user.email }, "Sab badiya."));
});

export { healthCheck };
