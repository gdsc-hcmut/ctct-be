import mongoose, { Document, Schema, Types } from "mongoose";

export type PredefinedAccessLevelName = "visitor" | "student";

export enum Permission {
    // User permissions
    VIEW_MATERIAL = "VIEW_MATERIAL",
    VIEW_PREVIOUS_EXAM = "VIEW_PREVIOUS_EXAM",
    VIEW_QUIZ_TEMPLATE = "VIEW_QUIZ_TEMPLATE",
    TAKE_QUIZ = "TAKE_QUIZ",

    // Admin permissions, UI should display admin tab if user has any of these permissions
    ADMIN_VIEW_MATERIAL = "ADMIN_VIEW_MATERIAL",
    ADMIN_UPLOAD_MATERIAL = "ADMIN_UPLOAD_MATERIAL",
    ADMIN_EDIT_MATERIAL = "ADMIN_EDIT_MATERIAL",
    ADMIN_DELETE_MATERIAL = "ADMIN_DELETE_MATERIAL",

    ADMIN_VIEW_PREVIOUS_EXAM = "ADMIN_VIEW_PREVIOUS_EXAM",
    ADMIN_UPLOAD_PREVIOUS_EXAM = "ADMIN_UPLOAD_PREVIOUS_EXAM",
    ADMIN_EDIT_PREVIOUS_EXAM = "ADMIN_EDIT_PREVIOUS_EXAM",
    ADMIN_DELETE_PREVIOUS_EXAM = "ADMIN_DELETE_PREVIOUS_EXAM",

    ADMIN_VIEW_SUBJECT = "ADMIN_VIEW_SUBJECT",
    ADMIN_CREATE_SUBJECT = "ADMIN_CREATE_SUBJECT",
    ADMIN_EDIT_SUBJECT = "ADMIN_EDIT_SUBJECT",
    ADMIN_DELETE_SUBJECT = "ADMIN_DELETE_SUBJECT",

    ADMIN_VIEW_CHAPTER = "ADMIN_VIEW_CHAPTER",
    ADMIN_CREATE_CHAPTER = "ADMIN_CREATE_CHAPTER",
    ADMIN_EDIT_CHAPTER = "ADMIN_EDIT_CHAPTER",
    ADMIN_DELETE_CHAPTER = "ADMIN_DELETE_CHAPTER",

    ADMIN_VIEW_QUESTION_TEMPLATE = "ADMIN_VIEW_QUESTION_TEMPLATE",
    ADMIN_CREATE_QUESTION_TEMPLATE = "ADMIN_CREATE_QUESTION_TEMPLATE",
    ADMIN_EDIT_QUESTION_TEMPLATE = "ADMIN_EDIT_QUESTION_TEMPLATE",
    ADMIN_DELETE_QUESTION_TEMPLATE = "ADMIN_DELETE_QUESTION_TEMPLATE",

    ADMIN_VIEW_QUIZ_TEMPLATE = "ADMIN_VIEW_QUIZ_TEMPLATE",
    AMDIN_CREATE_QUIZ_TEMPLATE = "ADMIN_CREATE_QUIZ_TEMPLATE",
    ADMIN_EDIT_QUIZ_TEMPLATE = "ADMIN_EDIT_QUIZ_TEMPLATE",
    ADMIN_DELETE_QUIZ_TEMPLATE = "ADMIN_DELETE_QUIZ_TEMPLATE",
}

export type AccessLevelDocument = Document & {
    name: string;
    // we hardcode some roles in the system (e.g Visitor), so we need identifiers for them
    predefinedId?: PredefinedAccessLevelName;
    description: string;
    permissions: Permission[];
    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt?: number;
    deletedAt?: number;
};

const accessLevelSchema = new Schema<AccessLevelDocument>({
    name: String,
    predefinedId: String,
    description: String,
    permissions: [{ type: String, enum: Permission }],
    createdAt: Number,
    createdBy: Schema.Types.ObjectId,
    lastUpdatedAt: Number,
    deletedAt: Number,
});

const AccessLevelModel = mongoose.model<AccessLevelDocument>(
    "access_levels",
    accessLevelSchema
);
export default AccessLevelModel;
