import { QuizDocument, QuizStatus } from "../../../models/quiz.model";
import mongoose, { Types } from "mongoose";
import { QuizService } from "../../quiz.service";
import { SocketService } from "../../server-events/socket.service";
import { logger } from "../../../lib/logger";
import { TaskSchedulingService } from "../task_scheduling.service";
import { ScheduledTask } from "../scheduled_task";
import { QuestionTemplateService } from "../../question_template.service";

export class EndQuizTask implements ScheduledTask<QuizDocument> {
    private userId: Types.ObjectId;
    private quizId: Types.ObjectId;
    private quizService: QuizService;
    private socketService: SocketService;
    private taskSchedulingService: TaskSchedulingService;
    private questionTemplateService: QuestionTemplateService;

    constructor(
        userId: Types.ObjectId,
        quizId: Types.ObjectId,
        quizService: QuizService,
        socketService: SocketService,
        taskSchedulingService: TaskSchedulingService,
        questionTemplateService: QuestionTemplateService
    ) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizService = quizService;
        this.socketService = socketService;
        this.taskSchedulingService = taskSchedulingService;
        this.questionTemplateService = questionTemplateService;
    }

    async execute() {
        try {
            logger.info(
                `Ending quiz ${this.quizId.toString()} by ${this.userId.toString()}`
            );
            const quizEndTime = Date.now();
            const countCancelled = await this.taskSchedulingService.disable({
                "data.userId": this.userId,
                "data.quizId": this.quizId,
            });
            if (countCancelled === 0) {
                logger.debug(
                    `Didn't disable any end quiz task similar to quiz ${this.quizId.toString()}`
                );
            } else {
                logger.debug(
                    `Disabled ${countCancelled} end quiz task similar to quiz ${this.quizId.toString()}`
                );
            }

            const quiz = await this.quizService.findOne({
                _id: this.quizId,
                userId: this.userId,
                status: QuizStatus.ONGOING,
            });
            if (!quiz) {
                throw new Error(
                    `The requested quiz was not found, or may have already finished`
                );
            }

            quiz.questions.forEach((question) => {
                this.questionTemplateService.processQuestionAnswer(question);
            });
            quiz.status = QuizStatus.ENDED;
            quiz.endTime = quizEndTime;
            let cur = 0,
                tot = 0;
            quiz.questions.forEach((question) => {
                question.questions.forEach((subQuestion) => {
                    tot++;
                    if (subQuestion.isCorrect) {
                        cur++;
                    }
                });
            });
            quiz.standardizedScore = tot === 0 ? 0 : (10 * cur) / tot;
            quiz.markModified("questions");
            await quiz.save();

            return quiz;
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            throw error; // let whatever uses this handle the error
        }
    }
}
