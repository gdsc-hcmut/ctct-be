import mongoose, { Document, Schema, Types } from "mongoose";

export enum QuestionType {
    MULTIPLE_CHOICE_SINGLE_ANSWER = "MULTIPLE_CHOICE_SINGLE_ANSWER",
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS = "MULTIPLE_CHOICE_MULTIPLE_ANSWERS",
    TEXT = "TEXT",
    NUMBER = "NUMBER",
}

/**
 * Actual question generated using question template
 */
export type ConcreteQuestion = {
    description?: string;
    subQuestions: {
        type: QuestionType;
        description: string;
        options?: {
            key: number;
            description: string;
        }[];
        answerKey?: number;
        answerKeys?: number[];
        answerField?: string | number;
        matchCase?: boolean;
        maximumError?: number;
        explanation: string;

        // fields for logging user answer
        userAnswerKey?: number;
        userAnswerKeys?: number[];
        userAnswerField?: string | number;
        isCorrect: boolean;
    }[];
};

export type QuestionTemplateDocument = Document & {
    name: string;
    description?: string;

    code: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    subQuestions: {
        type: QuestionType;
        description: string;
        /**
         * Options to choose from (multiple choice questions)
         * and the key for the correct answer
         */
        options?: {
            key: number;
            description: string;
        }[];
        shuffleOptions?: boolean;
        answerKey?: number;
        answerKeys?: number[];

        /**
         * Store the correct answer on text or number field questions
         */
        answerField: string;
        matchCase?: boolean; // require matching case on text questions
        maximumError?: number; // maximum error allowed on numeric questions

        explanation: string;
    }[];

    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt: number;
    deletedAt: number;
};

const questionTemplateSchema = new Schema<QuestionTemplateDocument>({
    name: { type: String, required: true, default: "" },
    description: { type: String },
    code: { type: String, required: false, default: "" },
    subject: { type: Schema.Types.ObjectId, ref: "subjects", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "chapters", required: true },

    subQuestions: [
        {
            type: { type: String, enum: QuestionType, required: true },
            description: { type: String, required: true },
            options: [
                {
                    key: { type: Number, required: true },
                    description: { type: String, required: true },
                },
            ],
            shuffleOptions: { type: Boolean, required: false, default: false },
            answerKey: { type: Number, required: false },
            answerKeys: { type: Array<number>, required: false },

            answerField: { type: String, required: false },
            matchCase: { type: Boolean, required: false },
            maximumError: { type: Number, required: false },

            explanation: { type: String, required: false, default: "" },
        },
    ],

    createdAt: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    lastUpdatedAt: Number,
    deletedAt: Number,
});

const QuestionTemplateModel = mongoose.model<QuestionTemplateDocument>(
    "question_templates",
    questionTemplateSchema
);
export default QuestionTemplateModel;
