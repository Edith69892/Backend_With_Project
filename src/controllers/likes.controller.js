import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
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

  const likedCheck = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (likedCheck) {
    await Like.findByIdAndDelete(likedCheck?._id);
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likesCount: -1 } },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, "Unliked Successfull", {
        isLiked: false,
        likesCount: updatedVideo.likesCount,
      })
    );
  }

  await Like.create({ video: videoId, likedBy: req.user._id });
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { likesCount: 1 } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, "liked Successfull", {
      isLiked: true,
      likesCount: updatedVideo.likesCount,
    })
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id is Invalid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  const likedCheck = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (likedCheck) {
    await Like.findByIdAndDelete(likedCheck?._id);
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $inc: { likesCount: -1 },
      },
      {
        new: true,
      }
    );

    return res.status(200).json(
      new ApiResponse(200, "Unliked Successfull", {
        isLiked: false,
        likesCount: updatedComment.likesCount,
      })
    );
  }

  await Like.create({ comment: commentId, likedBy: req.user._id });
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $inc: { likesCount: 1 },
    },
    {
      new: true,
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "liked Successfull", {
      isLiked: true,
      likesCount: updatedComment.likesCount,
    })
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet Id is Invalid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const likedCheck = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (likedCheck) {
    await Like.findByIdAndDelete(likedCheck?._id);
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $inc: { likesCount: -1 },
      },
      {
        new: true,
      }
    );

    return res.status(200).json(
      new ApiResponse(200, "Unliked Successfull", {
        isLiked: false,
        likesCount: updatedTweet.likesCount,
      })
    );
  }

  await Like.create({ comment: tweetId, likedBy: req.user._id });
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $inc: { likesCount: 1 },
    },
    {
      new: true,
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "liked Successfull", {
      isLiked: true,
      likesCount: updatedTweet.likesCount,
    })
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $match: {
        "likedVideos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedVideos.owner",
        foreignField: "_id",
        as: "OwnerDetails",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$OwnerDetails",
    },
    {
      $project: {
        _id: "$likedVideos._id",
        title: "$likedVideos.title",
        description: "$likedVideos.description",
        duration: "$likedVideos.duration",
        views: "$likedVideos.views",
        likeCount: "$likedVideos.likeCount",
        "videoFile.url": "$likedVideos.videoFile.url",
        owner: "$OwnerDetails",
      },
    },
  ]);

  return res
  .status(200)
  .json( new ApiResponse(200, likedVideos, "Fetched all liked videos."))
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
