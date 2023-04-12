import mongoose, { Types, Schema } from "mongoose";

/**
 * A log of all mock exams of a student
 * Could have been made a part of student model, but it's too expensive
 * to call ref on, so it's now a separate model
 */

export type ExamHistoryDocument = Document & {
    // id that matches the user that owns this history
    _id: Types.ObjectId;

    examsPendingPayment: {
        _id: Types.ObjectId;
        requestedAt: number;
    }[];
    examsRegistered: {
        _id: Types.ObjectId;
        registeredAt: number;
    }[];
    examsCompleted: {
        _id: Types.ObjectId;
        completedAt: number;
        result: number;
    };
};

const examHistorySchema = new Schema<ExamHistoryDocument>({
    _id: Types.ObjectId,

    examsPendingPayment: [
        {
            _id: Types.ObjectId,
            requestedAt: Number,
        },
    ],
    examsRegistered: [
        {
            _id: Types.ObjectId,
            registeredAt: Number,
        },
    ],
    examsCompleted: [
        {
            _id: Types.ObjectId,
            completedAt: Number,
            result: Number,
        },
    ],
});

const ExamHistoryModel = mongoose.model<ExamHistoryDocument>(
    "exam_histories",
    examHistorySchema
);
export default ExamHistoryModel;
