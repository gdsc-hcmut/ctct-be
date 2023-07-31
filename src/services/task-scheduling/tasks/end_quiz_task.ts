import {
    QuizSessionDocument,
    QuizStatus,
} from "../../../models/quiz_session.model";
import { ScheduledTask } from "../scheduled_task";
import { Types } from "mongoose";
import { QuizSessionService } from "../../../services/quiz_session.service";
import { SocketService } from "../../../services/server-events/socket.service";
import { TaskSchedulingService } from "../task_scheduling.service";
import { QuestionService } from "../../../services/question.service";
import { logger } from "../../../lib/logger";

export class EndQuizTask implements ScheduledTask<QuizSessionDocument> {
    private userId: Types.ObjectId;
    private quizId: Types.ObjectId;
    private quizSessionService: QuizSessionService;
    private socketService: SocketService;
    private taskSchedulingService: TaskSchedulingService;
    private questionService: QuestionService;

    constructor(
        userId: Types.ObjectId,
        quizId: Types.ObjectId,
        quizSessionService: QuizSessionService,
        socketService: SocketService,
        taskSchedulingService: TaskSchedulingService,
        questionService: QuestionService
    ) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizSessionService = quizSessionService;
        this.socketService = socketService;
        this.taskSchedulingService = taskSchedulingService;
        this.questionService = questionService;
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

            const quiz = await this.quizSessionService.getUserOngoingQuizById(
                this.quizId,
                this.userId
            );

            if (!quiz) {
                throw new Error(
                    `The requested quiz was not found, or may have already finished`
                );
            }

            quiz.questions.forEach((question) => {
                this.questionService.processQuestionAnswer(question);
            });
            quiz.status = QuizStatus.ENDED;
            quiz.endTime = quizEndTime;
            let cur = 0,
                tot = 0;
            quiz.questions.forEach((question) => {
                tot++;
                if (question.isCorrect) {
                    cur++;
                }
            });
            quiz.standardizedScore = tot === 0 ? 0 : (10 * cur) / tot;
            await quiz.save();

            return quiz;
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            throw error; // let whatever uses this handle the error
        }
    }
}
