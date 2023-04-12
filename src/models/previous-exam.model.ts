import mongoose, { Types, Schema } from "mongoose";

/**
 * Exams from previous years
 */

export type PreviousExamDocument = Document & {
    name: string;
    isHiddenFromStudents: boolean;
    tags: Types.ObjectId[];
    bucketLink: string;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const previousExamSchema = new Schema<MaterialDocument>({
    name: { type: String, required: true },
    isHiddenFromStudents: { type: Boolean, default: false },
    tags: [
        {
            type: Types.ObjectId,
            ref: "tags",
        },
    ],
    bucketLink: { type: String, required: true },
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
