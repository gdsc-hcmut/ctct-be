import { Types } from "mongoose";
import { EventType } from "../../models/event.model";

export type CreateEventDto = {
    name: string;
    description: string;

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
};
