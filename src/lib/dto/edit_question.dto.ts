import { Types } from "mongoose";

export type EditQuestionDto = {
    name: string;
    code: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    description: string;

    options?: string[];
    shuffleOptions?: boolean;
    answerKeys?: number[];
    answerField?: string;
    matchCase?: boolean;
    maximumError?: number;

    explanation: string;
};
