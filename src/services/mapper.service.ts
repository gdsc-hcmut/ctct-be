import { inject, injectable } from "inversify";
import { logger } from "../lib/logger";
import { ConcreteQuestion } from "../models/question_template.model";
import _ from "lodash";
import { QuizTemplateDocument } from "../models/quiz_template.model";

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
}
