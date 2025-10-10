import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCludinary } from "../utils/cloudinary.js";
import { getVideoDurationInSeconds } from "get-video-duration";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Playlist } from "../models/plyalist.model.js";

//without condition
// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination

//   const getAggregateVideos = await Video.aggregate([
//     {
//       $match: {
//         $or: [
//           {
//             title: {
//               $regex: query,
//               $options: "i",
//             },
//           },
//           {
//             description: {
//               $regex: query,
//               $options: "i",
//             },
//           },
//         ],
//       },
//     },
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $match: {
//         isPublished: true,
//       },
//     },
//     {
//       $sort: {
//         [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1, // [ ] lets us use a variable/expression as the key dynamically
//       },
//     },
//     {
//       $lookup: {
//         from: "user",
//         localField: "owner",
//         foreignField: "_id",
//         as: "OwnerDetails",
//         pipeline: [
//           {
//             $project: {
//               userName: 1,
//               avatar: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $skip: (page - 1) * limit,
//     },
//     {
//       $limit: limit,
//     },
//   ]);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, getAggregateVideos[0], "Fetched videos successfully")
//     );
// });

// with conditon

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  let pipelines = [];

  if (query) {
    pipelines.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "User not found.");
    } else {
      pipelines.push({
        $match: { owner: new mongoose.Types.ObjectId(userId) },
      });
    }
  }

  //get only published videos
  pipelines.push({
    $match: {
      isPublished: true,
    },
  });

  //sortBy can be views created time and duration
  //sortType ; ascending(1) or descending(-1)

  pipelines.push({
    $sort: {
      [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1,
    },
  });

  pipelines.push(
    {
      $lookup: {
        from: "user",
        localField: "owner",
        foreignField: "_id",
        as: "OwnerDetails",
        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    }
    // {
    //     $skip : (page-1) * limit
    //  },
    // {
    //     $limit : limit
  );

  const aggregateVideos = Video.aggregate(pipelines);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const video = await Video.aggregatePaginate(aggregateVideos, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, " videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required.");
  }

  const videoPath = req.files?.videoFile?.[0]?.path;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;

  if (!videoPath) {
    throw new ApiError(400, "Video upload unsuccessful — no file found.");
  }

  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbanail upload unsuccessful — no file found.");
  }

  const duration = await getVideoDurationInSeconds(videoPath);

  const uploadedVideo = await uploadOnCludinary(videoPath);

  if (!uploadedVideo) {
    throw new ApiError(400, "Error uploading video to Cloudinary.");
  }

  const uploadThumbnail = await uploadOnCludinary(thumbnailPath);

  if (!uploadThumbnail) {
    throw new ApiError(400, "Error uploading thumbnail to Cloudinary.");
  }

  const video = await Video.create({
    title,
    description,
    isPublished: true,
    duration,
    owner: req.user._id,
    videoFile: {
      url: uploadedVideo.url,
      public_id: uploadedVideo.public_id,
    },
    thumbnail: {
      url: uploadThumbnail.url,
      public_id: uploadThumbnail.public_id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid user");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
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
      $lookup: {
        from: "users",
        localField: "owner",
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
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
      $addFields: {
        owner: { $first: "$OwnerDetails" },
        likeCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1,
        likeCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video?.length) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video id.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You have no access of update the video details because you are not owner."
    );
  }

  const oldThumbnailId = video.thumbnail?.public_id;
  const thumbnailPath = req.file?.path;
  let newThumbnail = null;

  if (thumbnailPath) {
    newThumbnail = await uploadOnCludinary(thumbnailPath);

    if (!newThumbnail?.url) {
      throw new ApiError(400, "Thumbnail url is missing");
    }
  }

  video.title = title || video.title;
  video.description = description || video.description;
  if (newThumbnail) {
    video.thumbnail = {
      url: newThumbnail.url,
      public_id: newThumbnail.public_id,
    };
  }

  await video.save();

  // delete old thumbnail

  // Delete old thumbnail (if replaced)
  if (newThumbnail && oldThumbnailId) {
    try {
      await cloudinary.uploader.destroy(oldThumbnailId);
    } catch (err) {
      console.error("Error deleting old thumbnail:", err.message);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, " Video details update successfull."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video id.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You have no access of update the video details because you are not owner."
    );
  }

  // delete vidoe form db
  const videoDelete = await Video.findByIdAndDelete(video?._id);

  if (!videoDelete) {
    throw new ApiError(400, "deleting video unsuccessfull");
  }

  //delte from playlist

  await Playlist.updateMany(
    { videos: videoId },
    { $pull: { videos : videoId } }
  );

  // delte video and thumbnail file from cloudinary
  await cloudinary.uploader.destroy(video.videoFile.public_id , { resource_type: "video" });
  await cloudinary.uploader.destroy(video.thumbnail.public_id , { resource_type: "video" });

  // delet related data like , comments

  await Like.deleteMany({
    video: videoId,
  });

  await Comment.deleteMany({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
