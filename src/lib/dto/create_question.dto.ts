import { Types } from "mongoose";
import { QuestionType } from "../../models/question.model";

export type CreateQuestionDto = {
    name: string;
    code: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;
    type: QuestionType;
    description: string;
    options?: string[];
    shuffleOptions?: boolean;
    answerKeys?: number[];
    answerField?: string;
    matchCase?: boolean;
    maximumError?: number;
    explanation: string;
};
