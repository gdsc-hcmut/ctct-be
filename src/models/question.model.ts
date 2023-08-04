import mongoose, { Document, Schema, Types } from "mongoose";

export enum QuestionType {
    MULTIPLE_CHOICE_SINGLE_ANSWER = "MULTIPLE_CHOICE_SINGLE_ANSWER",
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS = "MULTIPLE_CHOICE_MULTIPLE_ANSWERS",
    TEXT = "TEXT",
    NUMBER = "NUMBER",
}

export type UserAnswer = {
    answerKeys?: number[];
    answerField?: string | number;
};

export type ConcreteQuestion = {
    type: QuestionType;
    description: string;
    options?: {
        key: number;
        description: string;
    }[];
    answerKeys?: number[];
    answerField?: string | number;
    matchCase?: boolean;
    maximumError?: number;
    explanation: string;

    // fields for logging user answer
    userAnswerKeys?: number[];
    userAnswerField?: string | number;
    isCorrect: boolean;

    // flag a question for later view
    isFlagged: boolean;

    // note for each question after quiz session ends
    userNote: string;
};

export type QuestionDocument = Document & {
    name: string;

    code: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    type: QuestionType;
    description: string;

    options?: {
        key: number;
        description: string;
    }[];
    shuffleOptions?: boolean;
    answerKeys?: number[];
    answerField: string;
    matchCase?: boolean;
    maximumError?: number;

    explanation: string;

    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt: number;
    deletedAt: number;
};

const questionSchema = new Schema<QuestionDocument>({
    name: { type: String, required: true },
    code: { type: String, required: false, default: "" },
    subject: { type: Schema.Types.ObjectId, ref: "subjects", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "chapters", required: true },

    type: { type: String, enum: QuestionType, required: true },
    description: { type: String, default: "" },
    options: [
        {
            key: { type: Number, required: true },
            description: { type: String, required: true },
        },
    ],
    shuffleOptions: { type: Boolean, required: false, default: false },
    answerKeys: Array<number>,

    answerField: { type: String, required: false },
    matchCase: { type: Boolean, required: false },
    maximumError: { type: Number, required: false },

    explanation: { type: String, required: false, default: "" },

    createdAt: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    lastUpdatedAt: Number,
    deletedAt: Number,
});

const QuestionModel = mongoose.model<QuestionDocument>(
    "questions",
    questionSchema
);
export default QuestionModel;
