import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const userID = req.user?._id;

  //total videos count
  const totalVideos = await Video.countDocuments({
    owner: new mongoose.Types.ObjectId(userID),
  });

  // total views count

  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userID),
      },
    },
    {
      $group: {
        _id: null,
        totalviews: {
          $sum: "$views",
        },
      },
    },
  ]);

  const totalViewsCount = totalViews[0]?.totalviews || 0;

  // total likes

  const videos = await Video.find({
    owner: new mongoose.Types.ObjectId(userID),
  });
  const videoIds = videos.map((v) => v._id);

  const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

  // total subscribers

  const totalSubscribers = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(userID),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews: totalViewsCount,
        totalLikes,
        totalSubscribers,
      },
      "Channel stats fetched successfully."
    )
  );

  /////////////////////////////// Another method ///////////////////////////////

  // const totalSubscribers = await Subscription.aggregate([
  //     {
  //         $match: {
  //             channel: new mongoose.Types.ObjectId(userId)
  //         }
  //     },
  //     {
  //         $group: {
  //             _id: null,
  //             subscribersCount: {
  //                 $sum: 1
  //             }
  //         }
  //     }
  // ]);

  // const video = await Video.aggregate([
  //     {
  //         $match: {
  //             owner: new mongoose.Types.ObjectId(userId)
  //         }
  //     },
  //     {
  //         $lookup: {
  //             from: "likes",
  //             localField: "_id",
  //             foreignField: "video",
  //             as: "likes"
  //         }
  //     },
  //     {
  //         $project: {
  //             totalLikes: {
  //                 $size: "$likes"
  //             },
  //             totalViews: "$views",
  //             totalVideos: 1
  //         }
  //     },
  //     {
  //         $group: {
  //             _id: null,
  //             totalLikes: {
  //                 $sum: "$totalLikes"
  //             },
  //             totalViews: {
  //                 $sum: "$totalViews"
  //             },
  //             totalVideos: {
  //                 $sum: 1
  //             }
  //         }
  //     }
  // ]);

  // const channelStats = {
  //     totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
  //     totalLikes: video[0]?.totalLikes || 0,
  //     totalViews: video[0]?.totalViews || 0,
  //     totalVideos: video[0]?.totalVideos || 0
  // };
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const userId = req.user?._id;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: {
          $size: "$likes",
        },
        totalViews: "$views",
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        totalLikes: 1,
        totalViews: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully."));
});

export { getChannelStats, getChannelVideos };
