import { Story } from "../models/Story";
import { Destination } from "../models/Destination";
import { AppError } from "../utils/AppError";

export async function listStoriesForAdmin() {
  return Story.find({}).populate("destinationId", "name slug").sort({ updatedAt: -1 }).lean();
}

export async function getStoryForAdmin(id: string) {
  const story = await Story.findById(id).populate("destinationId", "name slug").lean();
  if (!story) throw AppError.notFound("Story not found");
  return story;
}

interface AudioInput {
  url: string | null;
  provider: string;
  mimeType: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
}

export interface CreateStoryInput {
  destinationId: string;
  category: string;
  title: string;
  description: string;
  transcript: string;
  audio?: AudioInput;
  sources: { publisher: string; title: string; url: string }[];
}

export async function createStory(input: CreateStoryInput, createdBy: string) {
  const destination = await Destination.findById(input.destinationId);
  if (!destination) throw AppError.notFound("Destination not found");

  const story = await Story.create({
    ...input,
    createdBy,
    status: "draft",
    isPublished: false,
  });
  return story.toObject();
}

export interface UpdateStoryInput {
  category?: string;
  title?: string;
  description?: string;
  transcript?: string;
  audio?: AudioInput;
  sources?: { publisher: string; title: string; url: string }[];
}

export async function updateStory(id: string, updates: UpdateStoryInput) {
  const story = await Story.findById(id);
  if (!story) throw AppError.notFound("Story not found");

  Object.assign(story, updates);

  // Like destination content, a substantive edit reopens review — a story reviewed against
  // old text shouldn't silently keep that status against changed text.
  if (story.status === "reviewed") {
    story.status = "in-review";
  }

  await story.save();
  return story.toObject();
}

export async function setStoryPublished(id: string, isPublished: boolean) {
  const story = await Story.findById(id);
  if (!story) throw AppError.notFound("Story not found");

  story.isPublished = isPublished;
  if (isPublished) story.status = "published";
  await story.save();
  return story.toObject();
}

export interface UpdateStoryReviewInput {
  status: "draft" | "in-review" | "reviewed" | "published";
}

export async function updateStoryReviewStatus(
  id: string,
  input: UpdateStoryReviewInput,
  reviewerId: string,
) {
  const story = await Story.findById(id);
  if (!story) throw AppError.notFound("Story not found");

  story.status = input.status;
  if (input.status === "reviewed" || input.status === "published") {
    story.reviewedAt = new Date();
    story.reviewedBy = reviewerId as never;
  }
  if (input.status === "published") {
    story.isPublished = true;
  }
  await story.save();
  return story.toObject();
}

export async function deleteStory(id: string) {
  const story = await Story.findById(id);
  if (!story) throw AppError.notFound("Story not found");
  await story.deleteOne();
}
