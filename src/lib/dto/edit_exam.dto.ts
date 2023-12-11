import { Types } from "mongoose";

export type EditExamSlotDto = {
    name: string;
    userLimit: number;
    questions: Types.ObjectId[];
    startedAt: number;
    endedAt: number;
};

export type EditExamDto = {
    name?: string;
    description?: string;

    isHidden?: boolean;
};
