import mongoose, { Schema, Types } from "mongoose";
import { ConcreteQuestion } from "./question.model";

export enum ExamSessionStatus {
    ONGOING = "ONGOING",
    ENDED = "ENDED",
}

export type ExamSessionDocument = {
    userId: Types.ObjectId;
    status: ExamSessionStatus;

    duration: number;
    startedAt: number;
    endedAt?: number;

    standardizedScore: number;
    fromExam: Types.ObjectId;
    examSlot: number;

    questions: ConcreteQuestion[];
};

const examSessionSchema = new Schema<ExamSessionDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    status: { type: String, enum: ExamSessionStatus },

    duration: { type: Number, required: true },
    startedAt: { type: Number, required: true },
    endedAt: { type: Number, required: false },

    standardizedScore: { type: Number, required: false, default: 0 },
    fromExam: { type: Schema.Types.ObjectId, ref: "exams" },
    examSlot: Number,

    questions: Array<ConcreteQuestion>,
});

const ExamSessionModel = mongoose.model<ExamSessionDocument>(
    "exam_sessions",
    examSessionSchema
);
export default ExamSessionModel;
