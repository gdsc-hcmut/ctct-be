import mongoose, { Types, Schema } from "mongoose";
import { UserRole } from "./user.model";

/**
 * Materials are organized in a tree structure
 * Each material holds references to its parent and children
 * It also has has tag and a boolean to check if it's a folder
 */

export type MaterialDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    chapter: number;

    readAccess: UserRole[];
    writeAccess: UserRole[];

    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const materialSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    chapter: Number,

    readAccess: [{ type: String, enum: UserRole }],
    writeAccess: [{ type: String, enum: UserRole }],

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
