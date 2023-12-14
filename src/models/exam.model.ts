import mongoose, { Document, Schema, Types } from "mongoose";
import { Semester } from "../config";
import { Gender } from "./user.model";

export enum ExamType {
    MIDTERM_EXAM = "MIDTERM_EXAM",
    FINAL_EXAM = "FINAL_EXAM",
}

export type ExamDocument = Document & {
    name: string;
    description: string;

    subject: Types.ObjectId;
    semester: Semester;
    type: ExamType;

    slots: {
        slotId: number;

        name: string;
        registeredUsers: {
            userId: Types.ObjectId;
            givenName: string;
            familyAndMiddleName: string;
            dateOfBirth: number;
            studentId: string;
            major: string;
            gender: Gender;
            phoneNumber: string;
        }[];
        userLimit: number;
        questions: Types.ObjectId[];

        startedAt: number;
        endedAt: number;
    }[];

    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;

    isHidden: boolean;
    deletedAt?: number;
};

const examSchema = new Schema<ExamDocument>({
    name: { type: String, required: true },
    description: { type: String, required: false },

    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    semester: { type: String, enum: Semester },
    type: { type: String, enum: ExamType },

    slots: [
        {
            slotId: Number,

            name: { type: String, required: true },
            registeredUsers: [
                {
                    userId: { type: Schema.Types.ObjectId, ref: "users" },
                    givenName: String,
                    familyAndMiddleName: String,
                    dateOfBirth: Number,
                    studentId: String,
                    major: String,
                    gender: { type: String, enum: Gender },
                    phoneNumber: String,
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

    isHidden: Boolean,
    deletedAt: { type: Number, required: false },
});

const ExamModel = mongoose.model<ExamDocument>("exams", examSchema);
export default ExamModel;
