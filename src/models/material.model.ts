import mongoose, { Types, Schema } from "mongoose";

export type MaterialDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    chapter: number;

    visibleTo: Types.ObjectId[];

    subtitle: string;
    description: string;
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;

    deletedAt: number;
};

const materialSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    chapter: Number,

    visibleTo: [{ type: Schema.Types.ObjectId, ref: "access_levels" }],

    subtitle: String,
    description: String,
    resource: { type: Schema.Types.ObjectId, ref: "attachments" },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,

    deletedAt: Number,
});

const MaterialModel = mongoose.model<MaterialDocument>(
    "materials",
    materialSchema
);
export default MaterialModel;
