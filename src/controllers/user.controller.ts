import { Router } from "express";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { ServiceType } from "../types";
import { Controller } from "./controller";

import { UserService, AuthService } from "../services";

@injectable()
export class UserController extends Controller {
    public readonly router = Router();
    public readonly path = "/users";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));

        this.router.all("*", this.authService.authenticate());
    }
}
