import { injectable, inject } from "inversify";
import passport from "passport";
import {
    Strategy,
    ExtractJwt,
    StrategyOptions,
    VerifiedCallback,
} from "passport-jwt";
import jwt from "jwt-simple";
import { NextFunction } from "express";
import _, { toNumber } from "lodash";
import moment from "moment";
// import { Collection, ObjectID, ObjectId } from 'mongodb';
import passportGoogle from "passport-google-oauth20";
import User, { UserDocument, UserRole } from "../models/user.model";
import { parseTokenMeta } from "../models/token.model";
const GoogleStrategy = passportGoogle.Strategy;
import { Request, Response, ServiceType } from "../types";
import { ErrorUserInvalid } from "../lib/errors";
import { UserService } from "./user.service";
import Token from "../models/token.model";
// import { MailService } from '.';
import { lazyInject } from "../container";
import QuizHistoryModel from "../models/quiz-history";
import ExamHistoryModel from "../models/exam-history";
@injectable()
export class AuthService {
    @lazyInject(ServiceType.User) private userService: UserService;
    constructor() {
        console.log("[Auth Service] Construct");
    }

    applyMiddleware() {
        const options: StrategyOptions = {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        };
        const strategyJwt = new Strategy(
            options,
            this.verifyAccountCode.bind(this)
        );
        passport.use(strategyJwt);

        const strategy = new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/auth/google/redirect",
            },
            async (accessToken, refreshToken, profile, done) => {
                const user = await this.userService.findOne({
                    googleId: profile.id,
                });
                // If user doesn't exist creates a new user. (similar to sign up)
                if (!user) {
                    const newUser = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails?.[0].value,
                        picture: profile._json.picture,
                        role: UserRole.STUDENT,
                        // we are using optional chaining because profile.emails may be undefined.
                    });
                    await QuizHistoryModel.create({ _id: newUser._id });
                    await ExamHistoryModel.create({ _id: newUser._id });
                    if (newUser) {
                        done(null, newUser);
                    }
                } else {
                    if (user.picture !== profile._json.picture) {
                        user.picture = profile._json.picture;
                        await user.save();
                    }
                    done(null, user);
                }
                // console.log('Profile', profile);
            }
        );

        passport.use(strategy);

        passport.serializeUser((user: UserDocument, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            const user: UserDocument = await User.findById(id);
            done(null, user);
        });

        return passport.initialize();
    }

    async verifyAccountCode(payload: any, done: VerifiedCallback) {
        const tokenMeta = parseTokenMeta(payload);

        try {
            const token = await Token.findOne({
                _id: tokenMeta._id,
            });
            if (token) {
                return done(null, tokenMeta);
            }

            return done(null, false, "Invalid token");
        } catch (error) {
            done(error, null);
        }
    }

    authenticate(block = true) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                passport.authenticate("jwt", async (err, tokenMeta, info) => {
                    req.tokenMeta = tokenMeta;
                    if (block && _.isEmpty(tokenMeta)) {
                        res.composer.unauthorized();
                        return;
                    }

                    next();
                })(req, res, next);
            } catch (err: any) {
                console.log(err);
            }
        };
    }

    private async createToken(
        userId: string,
        googleId: string,
        userAgent: string,
        role: UserRole
    ) {
        const result = await Token.create({
            googleId,
            userAgent,
            userId,
            createdAt: moment().unix(),
            expiredAt: moment().unix() + toNumber(process.env.TOKEN_TTL),
            role,
        });
        const EncodeToken = jwt.encode(
            {
                _id: result._id,
                googleId,
                userAgent,
                userId,
                createdAt: moment().unix(),
                expiredAt: moment().unix() + toNumber(process.env.TOKEN_TTL),
                role,
            },
            process.env.JWT_SECRET
        );

        // const createdToken = result.ops[0] as TokenDocument;
        return EncodeToken;
    }

    async generateTokenUsingUsername(
        userId: string,
        googleId: string,
        email: string,
        role: UserRole
    ) {
        return await this.createToken(userId, googleId, email, role);
    }

    async generateTokenGoogle(user: UserDocument, role: UserRole) {
        if (_.isEmpty(user)) {
            throw new ErrorUserInvalid("User not exist");
        }

        return await this.createToken(
            user._id,
            user.googleId,
            user.email,
            role
        );
    }
}
