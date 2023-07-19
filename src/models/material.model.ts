import mongoose, { Types, Schema } from "mongoose";

export type MaterialDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    visibleTo: Types.ObjectId[];

    description: string;
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt?: number;

    deletedAt: number;
};

const materialSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    chapter: { type: Schema.Types.ObjectId, required: true, ref: "chapters" },

    visibleTo: [{ type: Schema.Types.ObjectId, ref: "access_levels" }],

    description: String,
    resource: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "attachments",
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
    lastUpdatedAt: Number,

    deletedAt: Number,
});

const MaterialModel = mongoose.model<MaterialDocument>(
    "materials",
    materialSchema
);
export default MaterialModel;
