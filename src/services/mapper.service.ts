import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { ConcreteQuestion } from "../models/question.model";
import _ from "lodash";
import { QuizDocument } from "../models/quiz.model";
import { QuizSessionDocument, QuizStatus } from "../models/quiz_session.model";

@injectable()
export class MapperService {
    constructor() {
        logger.info("[Mapper] Initializing...");
    }

    maskAnswerFromConcreteQuestion(question: ConcreteQuestion) {
        return {
            ..._.omit(question, [
                "answerKey",
                "answerKeys",
                "answerField",
                "explanation",
                "isCorrect",
            ]),
        };
    }

    maskQuestionsFromQuiz(quiz: QuizDocument) {
        return _.omit(quiz.toObject(), ["potentialQuestions"]);
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
        ]);

        switch (status) {
            case QuizStatus.ONGOING: {
                return {
                    ..._.omit(data, ["questions"]),
                    questions: _.map(data.questions, (question) =>
                        this.maskAnswerFromConcreteQuestion(question)
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
