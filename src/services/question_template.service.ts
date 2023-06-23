import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { Types } from "mongoose";
import QuestionTemplateModel from "../models/question_template.model";

@injectable()
export class QuestionTemplateService {
    constructor() {
        logger.info("Constructing Question Template service");
    }

    async create(userId: Types.ObjectId, data: any) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        return await QuestionTemplateModel.create({
            ...data,
            createdAt: Date.now(),
            createdBy: userId,
        });
    }
}
