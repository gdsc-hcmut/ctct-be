import "reflect-metadata";

import { App } from "./app";
import container from "./container";
import { applyHttpResponseComposer } from "./lib/response-composer";

import { AuthService, UserService } from "./services";
import { FileUploadService } from "./services/file-upload.service";
import { PreviousExamService } from "./services/previous-exams.service";
import { SubjectService } from "./services/subject.service";
import { MaterialService } from "./services/material.service";
import { CacheService } from "./services/cache.service";
import { AuthController, UserController } from "./controllers";
import { MaterialController } from "./controllers/material.controller";
import { MeController } from "./controllers/me.controller";
import { SubjectController } from "./controllers/subject.controller";
import { PreviousExamController } from "./controllers/previous-exam.controller";
import { ServiceType } from "./types";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { toNumber } from "lodash";
dotenv.config();

console.log(`Connecting to DB: ${process.env.DB_URI}`);
mongoose.connect(process.env.DB_URI);
mongoose.connection.once("connected", () => {
    console.log("Connected to DB!");
});

// Binding service
container
    .bind<AuthService>(ServiceType.Auth)
    .to(AuthService)
    .inSingletonScope();
container
    .bind<UserService>(ServiceType.User)
    .to(UserService)
    .inSingletonScope();
container
    .bind<FileUploadService>(ServiceType.FileUpload)
    .to(FileUploadService)
    .inSingletonScope();
container
    .bind<PreviousExamService>(ServiceType.PreviousExam)
    .to(PreviousExamService)
    .inSingletonScope();
container
    .bind<SubjectService>(ServiceType.Subject)
    .to(SubjectService)
    .inSingletonScope();
container
    .bind<MaterialService>(ServiceType.Material)
    .to(MaterialService)
    .inSingletonScope();
container
    .bind<CacheService>(ServiceType.Cache)
    .to(CacheService)
    .inSingletonScope();

// Initialize service first
Promise.all([
    // container.get<DatabaseService>(ServiceType.Database).initialize(),
]).then(() => {
    const app = new App(
        [
            container.resolve<AuthController>(AuthController),
            container.resolve<UserController>(UserController),
            container.resolve<MeController>(MeController),
            container.resolve<PreviousExamController>(PreviousExamController),
            container.resolve<SubjectController>(SubjectController),
            container.resolve<MaterialController>(MaterialController),
        ],
        toNumber(process.env.PORT),
        [
            applyHttpResponseComposer,
            container.get<AuthService>(ServiceType.Auth).applyMiddleware(),
        ]
    );

    app.listen();
    // container.get<SocketService>(ServiceType.Socket).initialize(app.io);
});
