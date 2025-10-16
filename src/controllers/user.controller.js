  import { asyncHandler } from "../utils/asyncHandler.js";
  import { ApiError } from "../utils/ApiError.js";
  import { User } from "../models/user.model.js";
  import { uploadOnCludinary } from "../utils/cloudinary.js";
  import { ApiResponse } from "../utils/ApiResponse.js";
  import jwt from "jsonwebtoken";
  import { v2 as cloudinary } from "cloudinary";
  import mongoose from "mongoose";

  const genrateAccessTokenAndREfreshToken = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  };

  const registerUser = asyncHandler(async (req, res, next) => {
    // Get the user details from frontend
    // check if user already exists : username , email
    // validation (not empaty)
    // check for img and avtar
    // if available uplaod them to  cloudinary , avatar
    // create user object and create entry in db
    // remove password and refreshtoken from user object before sending response
    // check for errors and send response
    // return res
    // files are available in req.files

    const { userName, fullName, email, password } = req.body;

    // console.log("Email:",email);

    // Basic required checks
    if (!fullName || fullName.trim() === "") {
      throw new ApiError(400, "Fullname is required");
    }
    if (!userName || userName.trim() === "") {
      throw new ApiError(400, "Username is required");
    }
    if (!email || email.trim() === "") {
      throw new ApiError(400, "Email is required");
    }
    if (!password || password.trim() === "") {
      throw new ApiError(400, "Password is required");
    }

    // Type checks

    if (typeof fullName !== "string") {
      throw new ApiError(400, "Fullname must be a string");
    }
    if (typeof userName !== "string") {
      throw new ApiError(400, "Username must be a string");
    }
    if (typeof email !== "string") {
      throw new ApiError(400, "Email must be a string");
    }
    if (typeof password !== "string") {
      throw new ApiError(400, "Password must be a string");
    }

    //email format check
    const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailregex.test(email)) {
      throw new ApiError(400, "Email is not valid");
    }

    // password validation

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      );
    }

    // check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists with this email or username");
    }

    // check for files

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "avatar file is required");
    }

    // upload files to cloudinary
    const avatar = await uploadOnCludinary(avatarLocalPath);

    let coverImage = null;
    if (coverImageLocalPath) {
      coverImage = await uploadOnCludinary(coverImageLocalPath);
    }

    if (!avatar) {
      throw new ApiError(400, "Avatar file is required, erro in cludinary");
    }

    // create user object and save to db

    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    const user = await User.create({
      fullName,
      avatar: {
        url: avatar.url,
        public_id: avatar.public_id,
      },
      coverImage: {
        url: coverImage?.url || "",
        public_id: coverImage?.public_id || "",
      },
      email,
      userName,
      password,
    });

    const createduser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createduser) {
      throw new ApiError(500, "User not found after creation");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, "User registered successfully", createduser));
  });

  //login user

  const loginUser = asyncHandler(async (req, res) => {
    // get email and password from req.body
    // validate email and password (not empty)
    // check if user exists with given email
    // if exists then compare password
    // if password matches then genrate access token and refresh token
    // save refresh token in db
    // return response with user object (without password and refresh token) and access token and refresh token

    const { email, userName, password } = req.body;

    if (!(userName || email)) {
      throw new ApiError(400, "Email or Username is required");
    }

    const user = await User.findOne({
      $or: [{ email }, { userName }],
    });
    const ispassword = await user.ispasswordValid(password);

    if (!ispassword) {
      throw new ApiError(400, "Password is required");
    }

    const { accessToken, refreshToken } = await genrateAccessTokenAndREfreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "User logged in successfully", {
          user: loggedInUser,
          accessToken,
          refreshToken,
        })
      );
  });

  //log Out User
  const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { refreshToken: undefined },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, "User logged out successfully", {}));
  });

  const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
      const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

      if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request.");
      }

      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken?._id);

      if (!user) {
        throw new ApiError(401, "Invallid Refresh Token ");
      }
      console.log("Incoming:", incomingRefreshToken);
      console.log("From DB:", user.refreshToken);

      if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh Token is expire or used.");
      }

      //regenrate accessToken

      const { accessToken, newRefreshToken } =
        await genrateAccessTokenAndREfreshToken(user._id);

      const options = {
        httpOnly: true,
        secure: true,
      };

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              accessToken,
              refreshToken: newRefreshToken,
            },
            "Access token refreshed"
          )
        );
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid RefreshToken.");
    }
  });

  const ChangeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
      throw new ApiError(400, "User not found.");
    }

    const isPasswordCorrect = await user.ispasswordValid(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid Password.");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password change successfully."));
  });

  const GetCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
      new ApiResponse(200, "User Fetched Successfully", {
        user: req.user,
      })
    );
  });

  const UpdateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName || email)) {
      throw new ApiError(400, "FullName or email is required.");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email: email,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, "Update successfully.", user));
  });

  const updateUserAvatar = asyncHandler(async (req, res) => {
    let user = await User.findById(req.user?._id);
    const oldAvatarId = user.avatar?.public_id;

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "avatar file is required");
    }

    const avatar = await uploadOnCludinary(avatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(400, "avatar url is missing");
    }

    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: {
            url: avatar.url,
            public_id: avatar.public_id,
          },
        },
      },
      {
        new: true,
      }
    ).select("-password");

    // delete old avatar

    if (oldAvatarId) {
      await cloudinary.uploader.destroy(oldAvatarId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Avatar Update successfully.", user));
  });

  const updateCoverImage = asyncHandler(async (req, res) => {
    let user = await User.findById(req.user?._id);
    const oldCoverImgId = user.coverImage?.public_id;
    const CoverImageLocalPath = req.file?.path;

    if (!CoverImageLocalPath) {
      throw new ApiError(400, "Cover Image file is required");
    }

    const coverImage = await uploadOnCludinary(CoverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(400, "cover Img url is missing");
    }

    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: {
            url: coverImage.url,
            public_id: coverImage.public_id,
          },
        },
      },
      {
        new: true,
      }
    ).select("-password");

    if (oldCoverImgId) {
      await cloudinary.uploader.destroy(oldCoverImgId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Cover Image Update successfully.", user));
  });

  //Channale Profile

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "Username is missing.");
  }


  
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),  
      },
    },
    {
      $lookup: {
        from: "subscriptions",              
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",              
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        email: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched successfully")
    );
});


  //WatchHistory

  const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
          //req.user._id comes from your authentication middleware, usually as a string.
          // Mongoose usually converts _id automatically to ObjectId in simple queries like User.findById(req.user._id).
          // But in aggregation pipelines, MongoDB expects _id to be an ObjectId. So you must manually convert it using:
          // new mongoose.Types.ObjectId(req.user._id)
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      userName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",

                },
              },
            },
          ],
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "watch History Fetched successfully",
          user[0].watchHistory
        )
      );
  });

  export {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    ChangeCurrentPassword,
    GetCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
  };
