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

        const data = _.omit(quizSession.toObject(), [
            "fromQuiz.potentialQuestions",
            "fromQuiz.subject.createdBy",
            "fromQuiz.subject.createdAt",
            "fromQuiz.duration",
            "fromQuiz.sampleSize",
            "fromQuiz.createdBy",
            "fromQuiz.createdAt",
            "fromQuiz.lastUpdatedAt",
            "fromQuiz.__v",
            "fromQuiz.subject.__v",
            "fromQuiz.subject.createdAt",
            "fromQuiz.subject.createdBy",
            "fromQuiz.subject.lastUpdatedAt",
            "fromQuiz.chapter.__v",
            "fromQuiz.chapter.createdAt",
            "fromQuiz.chapter.createdBy",
            "fromQuiz.chapter.lastUpdatedAt",
            "__v",
        ]);

        switch (status) {
            case QuizStatus.ONGOING: {
                return {
                    ..._.omit(data, ["questions"]),
                    questions: _.map(data.questions, (question) =>
                        _.omit(question, [
                            "answerKey",
                            "answerKeys",
                            "answerField",
                            "explanation",
                            "isCorrect",
                            "userNotes",
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
