import { Types } from "mongoose";
import { Semester } from "../../config";
import { ExamType } from "../../models/exam.model";

export type CreateExamSlotDto = {
    name: string;
    userLimit: number;
    questions: Types.ObjectId[];
    startedAt: number;
    endedAt: number;
};

export type CreateExamDto = {
    name: string;
    description: string;

    subject: Types.ObjectId;
    semester: Semester;
    type: ExamType;

    registrationStartedAt: number;
    registrationEndedAt: number;

    slots: CreateExamSlotDto[];
};
