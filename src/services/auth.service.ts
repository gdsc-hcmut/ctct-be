import { inject, injectable } from "inversify";
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
import passportGoogle from "passport-google-oauth20";
import User, { UserDocument } from "../models/user.model";
import { parseTokenMeta } from "../models/token.model";
const GoogleStrategy = passportGoogle.Strategy;
import { Request, Response, ServiceType } from "../types";
import { ErrorUserInvalid } from "../lib/errors";
import Token from "../models/token.model";
import { lazyInject } from "../container";
import { logger } from "../lib/logger";
import { Types } from "mongoose";
import { UserService, AccessLevelService } from "../services/index";
import { EMAIL_WHITE_LIST, GOOGLE_CLIENT_ID } from "../config";
import { OAuth2Client } from "google-auth-library";

@injectable()
export class AuthService {
    private googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    @lazyInject(ServiceType.User) private userService: UserService;
    constructor(
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService
    ) {
        logger.info("[Auth] Initializing...");
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
                passReqToCallback: true,
            },
            async (req, accessToken, refreshToken, profile, done) => {
                const user = await this.userService.findOne({
                    googleId: profile.id,
                });
                // If user doesn't exist creates a new user. (similar to sign up)
                if (!user) {
                    const userIsInWhiteList = _.some(
                        EMAIL_WHITE_LIST,
                        (email) => email === profile.emails?.[0].value
                    );

                    if (!userIsInWhiteList) {
                        const validEmail = /.+@hcmut\.edu\.vn/.test(
                            profile.emails?.[0].value
                        );
                        if (!validEmail) {
                            req.session.errorRedirectUrl = `${process.env.REDIRECT_URI}/error/bad-email`;
                            return done(null, profile);
                        }
                    }

                    let givenName = profile.name?.givenName;
                    const familyName = profile.name?.familyName ?? "";
                    const middleName = profile.name?.middleName;
                    if (!profile.name) {
                        // fallback to using display name for first name
                        givenName = profile.displayName;
                    }
                    const newUser = await User.create({
                        googleId: profile.id,
                        accessLevels: [
                            this.accessLevelService.getStudentAccessLevelId(),
                        ],
                        isManager: false,
                        familyAndMiddleName:
                            familyName + (middleName ? " " + middleName : ""),
                        givenName: givenName,
                        email: profile.emails?.[0].value,
                        picture: profile._json.picture,
                        // we are using optional chaining because profile.emails may be undefined.
                    });
                    if (newUser) {
                        return done(null, newUser);
                    }
                } else {
                    if (user.picture !== profile._json.picture) {
                        user.picture = profile._json.picture;
                        await user.save();
                    }
                    return done(null, user);
                }
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
        accessLevels: Types.ObjectId[],
        isManager: boolean
    ) {
        const result = await Token.create({
            googleId,
            userAgent,
            userId,
            createdAt: moment().unix(),
            expiredAt: moment().unix() + toNumber(process.env.TOKEN_TTL),
            accessLevels: accessLevels,
            isManager: isManager,
        });
        const EncodeToken = jwt.encode(
            {
                _id: result._id,
                googleId,
                userAgent,
                userId,
                createdAt: moment().unix(),
                expiredAt: moment().unix() + toNumber(process.env.TOKEN_TTL),
                accessLevels: accessLevels,
                isManager: isManager,
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
        accessLevels: Types.ObjectId[],
        isManager: boolean
    ) {
        return await this.createToken(
            userId,
            googleId,
            email,
            accessLevels,
            isManager
        );
    }

    async generateTokenGoogleSignin(idToken: string) {
        if (_.isEmpty(idToken)) {
            throw new ErrorUserInvalid("Missing IdToken");
        }

        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        console.log(payload);

        //check valid payload .... TODO
        if (!payload.email) {
            throw Error("Invalid email");
        }
        // Check env dev = whitelist, production
        let user = await User.findOne({ googleId: payload.sub });
        // If user doesn't exist creates a new user. (similar to sign up)
        if (!user) {
            const newUser = await User.create({
                googleId: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                accessLevels: [
                    this.accessLevelService.getStudentAccessLevelId(),
                ],
                isManager: false,
            });
            user = newUser;
        } else {
            if (user.picture !== payload.picture) {
                user.picture = payload.picture;
                await user.save();
            }
        }

        return await this.createToken(
            user._id,
            user.googleId,
            null,
            user.accessLevels,
            user.isManager
        );
    }

    async generateTokenGoogle(
        user: UserDocument,
        accessLevels: Types.ObjectId[],
        isManager: boolean
    ) {
        if (_.isEmpty(user)) {
            throw new ErrorUserInvalid("User not exist");
        }

        return await this.createToken(
            user._id,
            user.googleId,
            user.email,
            accessLevels,
            isManager
        );
    }
}
