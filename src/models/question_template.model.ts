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
    questions: {
        questionType: QuestionType;
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
        isCorrect: boolean;
        point: number;

        // fields for logging user answer
        userAnswerKey?: number;
        userAnswerKeys?: number[];
        userAnswerField?: string | number;
    }[];
    triesLeft: number;
};

export type QuestionTemplateDocument = Document & {
    name: string;
    /**
     * Description of the question, written in Markdown
     * This is used as a unified description for all subquestions, since
     * a question may have multiple subquestions
     */
    description?: string;

    /**
     * Whether the parser should be invoked when converting question
     * template into a concrete expression
     */
    code: string;
    subject: Types.ObjectId;
    chapter: number;

    questions: {
        questionType: QuestionType;
        description: string;
        /**
         * Options to choose from (multiple choice questions)
         * and the key for the correct answer
         */
        options?: {
            key: number;
            description: string;
        }[];
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
};

const questionTemplateSchema = new Schema<QuestionTemplateDocument>({
    name: { type: String, required: true, default: "" },
    description: { type: String },
    code: { type: String, required: false, default: "" },
    subject: { type: Schema.Types.ObjectId, ref: "subjects", required: true },
    chapter: { type: Number, required: true },

    questions: [
        {
            questionType: { type: String, enum: QuestionType, required: true },
            description: { type: String, required: true },
            options: [
                {
                    key: { type: Number, required: true },
                    description: { type: String, required: true },
                },
            ],
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
});

const QuestionTemplateModel = mongoose.model<QuestionTemplateDocument>(
    "question_templates",
    questionTemplateSchema
);
export default QuestionTemplateModel;
