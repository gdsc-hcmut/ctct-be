import mongoose, { Types, Schema } from "mongoose";
import { UserRole } from "./user.model";

/**
 * Exams from previous years
 */

export type PreviousExamDocument = Document & {
    name: string;
    readAccess: UserRole[];
    writeAccess: UserRole[];
    tags: Types.ObjectId[];
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    readAccess: [{ type: String, enum: UserRole }],
    writeAccess: [{ type: String, enum: UserRole }],
    tags: [
        {
            type: Schema.Types.ObjectId,
            ref: "tags",
        },
    ],
    resource: { type: Schema.Types.ObjectId, ref: "attachments" },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
    lastUpdatedAt: Number,
});

const PreviousExamModel = mongoose.model<PreviousExamDocument>(
    "previous_exams",
    previousExamSchema
);
export default PreviousExamModel;
