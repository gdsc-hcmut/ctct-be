import { logger } from "../../lib/logger";
import { Agenda, Job, JobAttributesData, JobOptions } from "agenda";
import { ScheduledTaskType } from "./schedule_task_type";
import { EndQuizTask } from "./tasks/end_quiz_task";
import { Types } from "mongoose";
import { inject, injectable } from "inversify";
import { ServiceType } from "../../types";
import { QuizService } from "../quiz.service";
import { SocketService } from "../server-events/socket.service";

@injectable()
export class TaskSchedulingService {
    private agenda: Agenda;

    constructor(
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Socket) private socketService: SocketService
    ) {
        this.initialize();
    }

    async initialize() {
        logger.info("[TaskScheduling] Initializing...");
        this.agenda = new Agenda({
            db: {
                address: process.env.DB_URI,
                collection: "scheduled_tasks",
            },
        });

        this.agenda.define(ScheduledTaskType.END_QUIZ, this.endQuiz.bind(this));

        await this.agenda.start();
    }

    async schedule(
        when: Date | string,
        type: ScheduledTaskType,
        data: JobAttributesData = {}
    ) {
        return await this.agenda.schedule(when, type, data);
    }

    async every(
        interval: string,
        type: ScheduledTaskType,
        data: JobAttributesData = {},
        options: JobOptions = {}
    ) {
        return await this.agenda.every(interval, type, data, options);
    }

    async now(type: ScheduledTaskType, data: JobAttributesData = {}) {
        return await this.agenda.now(type, data);
    }

    async cancel(query: any) {
        return await this.agenda.cancel(query);
    }

    async disable(query: any) {
        return await this.agenda.disable(query);
    }

    async endQuiz(job: Job) {
        try {
            const userId = job.attrs.data.userId as Types.ObjectId;
            const quizId = job.attrs.data.quizId as Types.ObjectId;
            if (!userId) {
                throw new Error(
                    `Trying to end quiz but missing ${userId.toString()}`
                );
            }
            if (!quizId) {
                throw new Error(
                    `Trying to end quiz of user ${userId.toString()} but missing ${quizId.toString()}`
                );
            }
            return await new EndQuizTask(
                userId,
                quizId,
                this.quizService,
                this.socketService,
                this
            ).execute();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
        }
    }
}
