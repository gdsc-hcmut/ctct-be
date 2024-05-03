import mongoose, { Document, Schema, Types } from "mongoose";
import { Gender } from "./user.model";

export interface EventCheckInQRCodeData {
    userId: string;
}

export enum EventType {
    LHOT = "LOP_HOC_ON_TAP",
    OTHER = "OTHER",
}

export type EventDocument = Document & {
    name: string;
    description?: string;

    eventType: EventType;
    venue: string;

    hasRegistrationTime: boolean;
    registrationStartedAt?: number;
    registrationEndedAt?: number;

    startedAt: number;
    endedAt: number;

    lhotMetadata?: {
        subject: Types.ObjectId;
    };

    registeredUsers: {
        userId: Types.ObjectId;
        checkedInAt?: number;

        givenName: string;
        familyAndMiddleName: string;
        dateOfBirth: number;
        studentId: string;
        major: string;
        gender: Gender;
        phoneNumber: string;

        registeredAt: number;
    }[];

    hasThumbnailAndBanner: boolean;
    thumbnailUrl?: string;
    bannerUrl?: string;

    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt: number;
    deletedAt?: number;
};

const eventSchema = new Schema<EventDocument>({
    name: { type: String, required: true },
    description: { type: String, required: false },

    eventType: { type: String, required: true, enum: EventType },
    venue: { type: String, required: true },

    hasRegistrationTime: { type: Boolean },
    registrationStartedAt: { type: Number, required: false },
    registrationEndedAt: { type: Number, required: false },

    startedAt: { type: Number, required: true },
    endedAt: { type: Number, required: true },

    lhotMetadata: {
        subject: { type: Schema.Types.ObjectId, ref: "subjects" },
        required: false,
    },

    registeredUsers: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            checkedInAt: { type: Number, required: false },

            givenName: { type: String, required: true },
            familyAndMiddleName: { type: String, required: true },
            dateOfBirth: { type: Number, required: true },
            studentId: { type: String, required: true },
            major: { type: String, required: true },
            gender: { type: String, required: true, enum: Gender },
            phoneNumber: { type: String, required: true },

            registeredAt: { type: Number, required: true },
        },
    ],

    hasThumbnailAndBanner: { type: Boolean },
    thumbnailUrl: { type: String, required: false },
    bannerUrl: { type: String, required: false },

    createdAt: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    lastUpdatedAt: { type: Number, required: true },
    deletedAt: { type: Number, required: false },
});

const EventModel = mongoose.model<EventDocument>("events", eventSchema);
export default EventModel;
