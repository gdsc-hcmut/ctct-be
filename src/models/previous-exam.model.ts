import mongoose, { Types, Schema } from "mongoose";
import { UserRole } from "./user.model";

/**
 * Exams from previous years
 */

export type PreviousExamDocument = Document & {
    name: string;
    subject: Types.ObjectId;

    readAccess: UserRole[];
    writeAccess: UserRole[];

    subtitle: string;
    description: string;
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },

    readAccess: [{ type: String, enum: UserRole }],
    writeAccess: [{ type: String, enum: UserRole }],

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

const PreviousExamModel = mongoose.model<PreviousExamDocument>(
    "previous_exams",
    previousExamSchema
);
export default PreviousExamModel;
