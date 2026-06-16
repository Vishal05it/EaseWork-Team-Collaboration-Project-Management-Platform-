import mongoose from "mongoose";
const aiChatSchema = new mongoose.Schema(
  {
    messageFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User ID is required"],
    },
    addedMs: {
      type: Number,
      required: [true, "Time of message is required"],
    },
    content: {
      type: String,
      required: [true, "Message is required"],
    },
    role: {
      type: String,
      enum: ["user", "system", "assistant"],
    },
  },
  { timestamps: true, strict: true },
);
export default mongoose.models.aichat || mongoose.model("aichat", aiChatSchema);
