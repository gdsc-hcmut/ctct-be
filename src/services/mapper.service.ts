import { injectable } from "inversify";
import { logger } from "../lib/logger";
import _ from "lodash";
import { QuizSessionDocument, QuizStatus } from "../models/quiz_session.model";

@injectable()
export class MapperService {
    constructor() {
        logger.info("[Mapper] Initializing...");
    }

    adjustQuizSessionAccordingToStatus(quizSession: QuizSessionDocument) {
        const status = quizSession.status;

        const data = quizSession.toObject();

        switch (status) {
            case QuizStatus.ONGOING: {
                return {
                    ..._.omit(data, ["questions", "standardizedScore"]),
                    questions: _.map(data.questions, (question) =>
                        _.omit(question, [
                            "answerKey",
                            "answerKeys",
                            "answerField",
                            "explanation",
                            "isCorrect",
                            "userNote",
                        ])
                    ),
                    timeLeft:
                        quizSession.startedAt +
                        quizSession.duration -
                        Date.now(),
                };
            }
            case QuizStatus.ENDED: {
                return data;
            }
            default: {
                throw new Error(
                    `An error happened while processing quiz document. Unknown status: ${status}`
                );
            }
        }
    }
}
