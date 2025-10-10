import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

//   const isLiked = await Like.findOne({ video: videoId, likedBy: req.user._id });

//   if (isLiked) {
//         await Like.findByIdAndDelete(isLiked?._id);
//         await Video.findByIdAndUpdate(videoId, {
//         $inc: { likesCount: -1 },
//         });

//         message = "Unlike successfull";

//   }
//    else {
//         await Like.create({ video: videoId, likedBy: req.user._id });
//         await Video.findByIdAndUpdate(video._id, {
//         $inc: { likesCount: 1 },
//         });
//         message = "like successfull";
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { likesCount: video.likesCount }, message));

    const likedCheck = await Like.findOne({ video: videoId, likedBy: req.user._id });

    if(likedCheck){
        await Like.findByIdAndDelete(isLiked?._id);
        await Video.findByIdAndUpdate(videoId, {
        $inc: { likesCount: -1 },
        });

        return res
        .status(200)
        .json( new ApiResponse(200, "Unliked Successfull", { isLiked : false, likesCount : video.likesCount}))

    }

        await Like.create({ video: videoId, likedBy: req.user._id });
        await Video.findByIdAndUpdate(video._id, {
        $inc: { likesCount: 1 },
        });

        return res
        .status(200)
        .json( new ApiResponse(200, "liked Successfull", { isLiked : true, likesCount : video.likesCount}))
    
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
