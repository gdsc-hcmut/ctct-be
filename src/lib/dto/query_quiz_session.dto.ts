import { Types } from "mongoose";

export type QueryQuizSessionDto = {
    name?: string;
    subject?: Types.ObjectId;
    chapter?: Types.ObjectId;
};
