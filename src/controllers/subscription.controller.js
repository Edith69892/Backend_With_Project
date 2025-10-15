import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id.");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found.");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    //unsubscribe
    await Subscription.deleteOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    const totalSubscriptions = await Subscription.countDocuments({
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totalSubscriptions },
          "Channel unsubscribed Successfully."
        )
      );
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  const totalSubscriptions = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { totalSubscriptions }, "Subscribed successfully.")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id.");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found.");
  }

  const subscriptions = await Subscription.findById(channel._id).populate(
    "subscriber",
    "userName fullName avatar"
  );

  const totalSubscribers = subscriptions.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers: subscriptions, totalSubscribers },
        "Subscribers fetched successfully."
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid SubscriberId.");
  }

  const subscriber = await User.findById(subscriberId);

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found.");
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "userName fullName avatar");

  const totalSubscribed = subscribedChannels.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channels: subscribedChannels, totalSubscribed },
        "Subscribed channels fetched successfully."
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
