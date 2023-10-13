import { injectable } from "inversify";
import { logger } from "../lib/logger";
import _ from "lodash";
import { QuizSessionDocument, QuizStatus } from "../models/quiz_session.model";
import {
    ExamSessionDocument,
    ExamSessionStatus,
} from "../models/exam_session.model";

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
                    timeLeft: Math.max(
                        quizSession.startedAt +
                            quizSession.duration -
                            Date.now(),
                        0
                    ),
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

    adjustExamSessionAccordingToStatus(examSession: ExamSessionDocument) {
        const status = examSession.status;

        const data = examSession.toObject();

        switch (status) {
            case ExamSessionStatus.ONGOING: {
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
                    timeLeft: Math.max(
                        examSession.startedAt +
                            examSession.duration -
                            Date.now(),
                        0
                    ),
                };
            }
            case ExamSessionStatus.ENDED: {
                return {
                    ..._.omit(data, ["questions"]),
                    questions: _.map(data.questions, (question) => {
                        _.omit(question, ["explanation", "userNote"]);
                    }),
                };
            }
            default: {
                throw new Error(
                    `An error happened while processing quiz document. Unknown status: ${status}`
                );
            }
        }
    }
}
