import mongoose, { Document, Schema, Types } from "mongoose";

export type NewsDocument = Document & {
    title: string;
    content: string;
    thumbnailUrl: string;
    author: string;

    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt: number;
    deletedAt?: number;
};

const newsSchema = new Schema<NewsDocument>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    thumbnailUrl: { type: String, required: false },
    author: { type: String, required: true },

    createdAt: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    lastUpdatedAt: { type: Number, required: true },
    deletedAt: { type: Number, required: false },
});

const NewsModel = mongoose.model<NewsDocument>("News", newsSchema);
export default NewsModel;
