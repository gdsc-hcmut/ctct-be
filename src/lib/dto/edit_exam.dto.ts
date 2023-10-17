import { Types } from "mongoose";
import { Semester } from "../../config";
import { ExamType } from "../../models/exam.model";

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

    registrationStartedAt?: number;
    registrationEndedAt?: number;

    isHidden?: boolean;
};
