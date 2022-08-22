"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.errorHandler = exports.verifyTokenAmount = exports.verifyAndAuthenticate = exports.checkToken = void 0;
const User_1 = require("../models/User");
const jwt = require("jsonwebtoken");
// check the Authorization token is not empty
const checkToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    }
    else
        next(new Error("token absent"));
};
exports.checkToken = checkToken;
// validate the token key and the expiration
const verifyAndAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
        req.user = yield User_1.User.findOne({ where: { email: decoded.email } });
        // check if user exists
        if (req.user === null)
            next(new Error(`user with email ${req.user.email} doesn't exist`));
    }
    catch (error) {
        if (typeof error === "object")
            if (error.name == "TokenExpiredError")
                res.status(403).send({ error: "Token Expired" });
            else
                res.status(403).send({ error: error.message });
        else
            next(new Error(error));
    }
    next();
});
exports.verifyAndAuthenticate = verifyAndAuthenticate;
// validate the token amount of the default user
const verifyTokenAmount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.user.token == 0 && !req.user.isAdmin) {
        res.status(401).send({ error: "Token amount is 0" });
    }
    else
        next();
});
exports.verifyTokenAmount = verifyTokenAmount;
// send back the error message
const errorHandler = (err, req, res, next) => {
    res.status(401).send({ error: err.message });
};
exports.errorHandler = errorHandler;
// check if the user is the admin
const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin)
        res.status(401).send({ error: "user must be the admin" });
    else
        next();
};
exports.isAdmin = isAdmin;
