import mongoose, { Types, Schema } from "mongoose";

/**
 * Exams from previous years
 */

export type PreviousExamDocument = Document & {
    name: string;
    isHiddenFromStudents: boolean;
    tags: Types.ObjectId[];
    resourceLink: string; // only one string because it's only one pdf
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    isHiddenFromStudents: { type: Boolean, default: false },
    tags: [
        {
            type: Types.ObjectId,
            ref: "tags",
        },
    ],
    resourceLink: { type: String, required: true },
    createdBy: {
        type: Types.ObjectId,
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
