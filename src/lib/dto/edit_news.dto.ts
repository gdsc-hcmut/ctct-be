import { Types } from "mongoose";

export type EditNewsDto = {
    title: string;
    content: string;
    thumbnail: string;
    author: string;
};
