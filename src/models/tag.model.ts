import mongoose, { Types, Schema } from "mongoose";

/**
 * General-purpose tag that can be used anywhere:
 * For example, in materials, exams, posts
 */

export type TagDocument = Document & {
    name: string;
    createdBy: Types.ObjectId;
    createdAt: number;
};

const tagSchema = new Schema<TagDocument>({
    name: { type: String, required: true },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
});

const TagModel = mongoose.model<TagDocument>("tags", tagSchema);
export default TagModel;
