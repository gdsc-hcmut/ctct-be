import mongoose, { Types, Schema } from "mongoose";

/**
 * Materials are organized in a tree structure
 * Each material holds references to its parent and children
 * It also has has tag and a boolean to check if it's a folder
 */

export type MaterialDocument = Document & {
    name: string;
    isFolder: boolean;
    isHidden: boolean;
    parentMaterial: Types.ObjectId;
    childrenMaterial: Types.ObjectId[];
    tags: Types.ObjectId[];
    bucketLink: string;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const materialSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    isFolder: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    parentMaterial: {
        type: Types.ObjectId,
        ref: "materials",
    },
    childrenMaterial: [
        {
            type: Types.ObjectId,
            ref: "materials",
        },
    ],
    tags: [
        {
            type: Types.ObjectId,
            ref: "tags",
        },
    ],
    bucketLink: String,
    createdBy: {
        type: Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
    lastUpdatedAt: Number,
});

const MaterialModel = mongoose.model<MaterialDocument>(
    "materials",
    materialSchema
);
export default MaterialModel;
