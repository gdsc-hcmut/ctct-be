import { QuizDocument, QuizStatus } from "../../../models/quiz.model";
import mongoose, { Types } from "mongoose";
import { QuizService } from "../../quiz.service";
import { SocketService } from "../../server-events/socket.service";
import { logger } from "../../../lib/logger";
import { TaskSchedulingService } from "../task_scheduling.service";
import { ScheduledTask } from "../scheduled_task";

export class EndQuizTask implements ScheduledTask<QuizDocument> {
    private userId: Types.ObjectId;
    private quizId: Types.ObjectId;
    private quizService: QuizService;
    private socketService: SocketService;
    private taskSchedulingService: TaskSchedulingService;

    constructor(
        userId: Types.ObjectId,
        quizId: Types.ObjectId,
        quizService: QuizService,
        socketService: SocketService,
        taskSchedulingService: TaskSchedulingService
    ) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizService = quizService;
        this.socketService = socketService;
        this.taskSchedulingService = taskSchedulingService;
    }

    async execute(): Promise<QuizDocument> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            logger.info(
                `Ending quiz ${this.quizId.toString()} by ${this.userId.toString()}`
            );
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

            const result = await this.quizService.findOneAndUpdate(
                {
                    _id: this.quizId,
                    userId: this.userId,
                    status: QuizStatus.ONGOING,
                },
                { status: QuizStatus.ENDED },
                { new: true }
            );
            if (!result) {
                throw new Error(
                    `The requested quiz was not found, or may have already finished`
                );
            }
            await session.commitTransaction();
            return result;
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            throw error; // let whatever uses this handle the error
        } finally {
            await session.endSession();
        }
    }
}
