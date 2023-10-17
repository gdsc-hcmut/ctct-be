import { Request as ERequest, Response as EResponse } from "express";
import { HttpResponseComposer } from "./lib/response-composer";
import { TokenDocument } from "./models/token.model";

export interface Request extends ERequest {
    tokenMeta?: TokenDocument;
}

export interface Response extends EResponse {
    composer?: HttpResponseComposer;
}

export const ServiceType = {
    Auth: Symbol.for("AuthService"),
    Database: Symbol.for("DatabaseService"),
    User: Symbol.for("UserService"),
    FileUpload: Symbol.for("FileUpload"),
    PreviousExam: Symbol.for("PreviousExam"),
    Subject: Symbol.for("Subject"),
    Chapter: Symbol.for("Chapter"),
    Material: Symbol.for("Material"),
    Cache: Symbol.for("Cache"),
    AccessLevel: Symbol.for("AccessLevel"),
    Question: Symbol.for("Question"),
    Quiz: Symbol.for("Quiz"),
    QuizSession: Symbol.for("QuizSession"),
    Mapper: Symbol.for("Mapper"),
    TaskScheduling: Symbol.for("TaskScheduling"),
    Socket: Symbol.for("Socket"),
    UserActivity: Symbol.for("UserActivity"),
    Exam: Symbol.for("Exam"),
    ExamSession: Symbol.for("ExamSession"),
};

export enum PrivacyType {
    PUBLIC = "public",
    PROTECTED = "protected",
    PRIVATE = "private",
}

export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE",
}

export type UploadFileInfo = {
    originalName: string;
    refName: string;
    mimetype: string;
};

export type DownloadFileInfo = {
    originalName: string;
    refName: string;
    mimetype: string;
    buffer: Buffer;
};
