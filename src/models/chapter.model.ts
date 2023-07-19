import mongoose, { Document, Schema, Types } from "mongoose";

export type ChapterDocument = Document & {
    name: string;
    subject: Types.ObjectId;

    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt?: number;
    deletedAt: number;
};

const chapterSchema = new Schema<ChapterDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects", required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
    createdAt: Number,
    lastUpdatedAt: Number,
    deletedAt: Number,
});

const ChapterModel = mongoose.model<ChapterDocument>("chapters", chapterSchema);
export default ChapterModel;
