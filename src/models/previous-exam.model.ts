import mongoose, { Types, Schema } from "mongoose";
import { Semester } from "../config";

export enum PreviousExamType {
    MIDTERM_EXAM = "MIDTERM_EXAM",
    FINAL_EXAM = "FINAL_EXAM",
}

export type PreviousExamDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    semester: Semester;
    type: PreviousExamType;

    description: string;
    resource: Types.ObjectId;

    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt?: number;

    isHidden: boolean;

    deletedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    semester: { type: String, enum: Semester },
    type: { type: String, enum: PreviousExamType },

    description: String,
    resource: { type: Schema.Types.ObjectId, ref: "attachments" },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
    lastUpdatedAt: Number,

    isHidden: { type: Boolean, default: false },

    deletedAt: Number,
});

const PreviousExamModel = mongoose.model<PreviousExamDocument>(
    "previous_exams",
    previousExamSchema
);
export default PreviousExamModel;
