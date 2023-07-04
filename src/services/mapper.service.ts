import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { ConcreteQuestion } from "../models/question_template.model";
import _ from "lodash";
import { QuizTemplateDocument } from "../models/quiz_template.model";
import { QuizDocument, QuizStatus } from "../models/quiz.model";

@injectable()
export class MapperService {
    constructor() {
        logger.info("Constructing Mapper service");
    }

    maskAnswerFromConcreteQuestion(question: ConcreteQuestion) {
        return {
            ..._.omit(question, "questions"),
            question: _.map(question.questions, (subQuestion) =>
                _.omit(subQuestion, [
                    "answerKey",
                    "answerKeys",
                    "answerField",
                    "explanation",
                ])
            ),
        };
    }

    maskQuestionsFromQuizTemplate(quizTemplate: QuizTemplateDocument) {
        return _.omit(quizTemplate.toObject(), ["potentialQuestions"]);
    }

    maskQuizDocumentAccordingToStatus(quiz: QuizDocument) {
        const status = quiz.status;
        // remove most metadata about the quiz template, only leaving the name
        const data = _.omit(quiz.toObject(), [
            "fromTemplate.potentialQuestions",
            "fromTemplate.visibleTo",
            "fromTemplate.subject.createdBy",
            "fromTemplate.subject.createdAt",
            "fromTemplate.subject.lastUpdatedAt",
            "fromTemplate.duration",
            "fromTemplate.sampleSize",
            "fromTemplate.createdBy",
            "fromTemplate.createdAt",
        ]);

        switch (status) {
            case QuizStatus.ONGOING: {
                return {
                    ..._.omit(data, ["questions"]),
                    questions: _.map(data.questions, (question) =>
                        this.maskAnswerFromConcreteQuestion(question)
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
}
