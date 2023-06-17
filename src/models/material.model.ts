import mongoose, { Types, Schema } from "mongoose";
import { UserRole } from "./user.model";

export type MaterialDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    chapter: number;

    visibleTo: UserRole[];

    subtitle: string;
    description: string;
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const materialSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    chapter: Number,

    visibleTo: Array<UserRole>,

    subtitle: String,
    description: String,
    resource: { type: Schema.Types.ObjectId, ref: "attachments" },
    createdBy: {
        type: Schema.Types.ObjectId,
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
