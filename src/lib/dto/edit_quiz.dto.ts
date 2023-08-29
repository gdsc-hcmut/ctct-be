import { Types } from "mongoose";

export type EditQuizDto = {
    name: string;
    description: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    duration: number;
    potentialQuestions: Types.ObjectId[];
    sampleSize: number;
    isHidden: boolean;
};
