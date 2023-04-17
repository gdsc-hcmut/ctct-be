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
    // Bundle: Symbol.for('BundleService'),
    Database: Symbol.for("DatabaseService"),
    // MQTT: Symbol.for('MQTTService'),
    User: Symbol.for("UserService"),
    FileUpload: Symbol.for("FileUpload"),
    PreviousExam: Symbol.for("PreviousExam"),
    // Upload: Symbol.for('Upload'),
    // Mail: Symbol.for('Mail'),
    // Contact: Symbol.for('Contact'),
    // Home: Symbol.for('Home'),
    // Room: Symbol.for('Room'),
    // Device: Symbol.for('Device'),
    // Socket: Symbol.for('Socket'),
    // DeviceStatus: Symbol.for('DeviceStatus'),
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
