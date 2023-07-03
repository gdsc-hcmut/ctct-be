import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import QuizModel, { QuizDocument } from "../models/quiz.model";

@injectable()
export class QuizService {
    constructor() {
        logger.info("Constructing Quiz service");
    }

    async find(query: FilterQuery<QuizDocument>) {
        return await QuizModel.find(query);
    }
}
