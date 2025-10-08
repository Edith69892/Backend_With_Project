import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCludinary } from "../utils/cloudinary.js";

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

  const videoPath = req.file?.path;
  if (!videoPath) {
    throw new ApiError(400, "Video upload unsuccessful — no file found.");
  }

  const uploadedVideo = await uploadOnCludinary(videoPath);
  if (!uploadedVideo) {
    throw new ApiError(400, "Error uploading video to Cloudinary.");
  }

  const video = await Video.create({
    title,
    description,
    isPublished: true,
    owner: req.user._id,
    videoFile: {   // ✅ This must match your schema field name
      url: uploadedVideo.url,
      public_id: uploadedVideo.public_id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully."));
});


const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
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
