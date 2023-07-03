import { injectable } from "inversify";
import { logger } from "../lib/logger";

@injectable()
export class QuizService {
    constructor() {
        logger.info("Constructing Quiz service");
    }
}
