import mongoose, { Document, Schema, Types } from "mongoose";
import { Semester } from "../config";

export enum ExamType {
    MIDTERM_EXAM = "MIDTERM_EXAM",
    FINAL_TERM = "FINAL_TERM",
}

export type ExamDocument = Document & {
    name: string;
    description: string;

    subject: Types.ObjectId;
    semester: Semester;
    type: ExamType;

    registrationStartedAt: number;
    registrationEndedAt: number;

    slots: {
        name: string;
        registeredUsers: Types.ObjectId[];
        userLimit: number;
        questions: Types.ObjectId;

        startedAt: number;
        endedAt: number;
    }[];

    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;

    deletedAt?: number;
};

const examSchema = new Schema<ExamDocument>({
    name: { type: String, required: true },
    description: { type: String, required: false },

    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    semester: { type: String, enum: Semester },
    type: { type: String, enum: ExamType },

    registrationStartedAt: { type: Number, required: true },
    registrationEndedAt: { type: Number, required: true },

    slots: [
        {
            name: { type: String, required: true },
            registeredUsers: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "users",
                },
            ],
            userLimit: { type: Number, required: true },
            questions: [{ type: Schema.Types.ObjectId, ref: "questions" }],

            startedAt: { type: Number, required: true },
            endedAt: { type: Number, required: true },
        },
    ],

    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    createdAt: { type: Number, required: true },
    lastUpdatedAt: { type: Number, required: true },

    deletedAt: { type: Number, required: false },
});

const ExamModel = mongoose.model<ExamDocument>("exams", examSchema);
export default ExamModel;
