import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { uploadOnCludinary } from '../utils/cloudinary.js';    
import { ApiResponse } from '../utils/ApiResponse.js';


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

    const {userName , fullName , email , password}  = req.body;

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

    if(typeof fullName !== 'string'){
        throw new ApiError(400, "Fullname must be a string");
    }
    if(typeof userName !== 'string'){
        throw new ApiError(400, "Username must be a string");
    }
    if(typeof email !== 'string'){
        throw new ApiError(400, "Email must be a string");
    }
    if(typeof password !== 'string'){
        throw new ApiError(400, "Password must be a string");
    }

    //email format check
    const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailregex.test(email)){
        throw new ApiError(400, "Email is not valid");
    }

    // password validation

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(!passwordRegex.test(password)){
        throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character");
        
    }  
    
    // check if user already exists
    const existingUser = await User.findOne({
        $or: [ {email}, {userName}]
    })
    
    if(existingUser){
        throw new ApiError(409, "User already exists with this email or username");
    }

    
    // check for files
    
    const avatarLocalPath =  req.files?.avatar?.[0]?.path; 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath ;
    
    if(req.files && Array.isArray( req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    


    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required");
    }
    
    // upload files to cloudinary
    const avatar = await uploadOnCludinary(avatarLocalPath)
    
    let coverImage = null;
    if(coverImageLocalPath){
        
        coverImage =  await uploadOnCludinary(coverImageLocalPath) ;
    }
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required, erro in cludinary");
    }
    
    
    // create user object and save to db
    
    console.log("req.body:", req.body);
console.log("req.files:", req.files);
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        userName ,
        password
    })
    
    const createduser =await User.findById(user._id).select("-password -refreshToken");
    
    if(!createduser){
        throw new ApiError(500, "User not found after creation");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully",createduser)
    )
})

export {registerUser};  