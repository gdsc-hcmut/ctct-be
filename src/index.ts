import "reflect-metadata";

import { App } from "./app";
import container from "./container";
import { applyHttpResponseComposer } from "./lib/response-composer";

import {
    AuthService,
    UserService,
    CacheService,
    FileUploadService,
    MaterialService,
    PreviousExamService,
    SubjectService,
    AccessLevelService,
} from "./services/index";

import {
    AuthController,
    MaterialController,
    MeController,
    PreviousExamController,
    SubjectController,
    UserController,
    AccessLevelController,
} from "./controllers/index";

import { ServiceType } from "./types";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { toNumber } from "lodash";
import { logger } from "./lib/logger";
dotenv.config();

logger.info(`Connecting to database at URI: ${process.env.DB_URI}`);
mongoose.connect(process.env.DB_URI);
mongoose.connection.once("connected", () => {
    logger.info("Database connection established");
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
container
    .bind<AccessLevelService>(ServiceType.AccessLevel)
    .to(AccessLevelService)
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
            container.resolve<AccessLevelController>(AccessLevelController),
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
