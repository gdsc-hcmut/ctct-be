import { QuestionType } from "../../models/question.model";

export type PreviewQuestionDto = {
    name: string;
    code: string;
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
