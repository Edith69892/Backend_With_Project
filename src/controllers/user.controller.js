import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCludinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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

const ChangeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword , newPassword} = req.body;
  
  const user = await User.findById(req.user?.id);
  if(!user){
    throw new ApiError(400,"User not found.")
  }

  const isPasswordCorrect = await user.ispasswordValid(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(401,"Invalid Password.")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(200,{}, "Password change successfully.")
  )
})

const GetCurrentUser = asyncHandler(async (req,res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      "User Fetched Successfully", 
      {
        user : req.user 
      }
      ))
  })

export { loginUser, logoutUser, registerUser, refreshAccessToken , ChangeCurrentPassword , GetCurrentUser};
