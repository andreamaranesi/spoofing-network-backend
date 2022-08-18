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
exports.errorHandler = exports.verifyAndAuthenticate = exports.checkToken = void 0;
const User_1 = require("../models/User");
const jwt = require('jsonwebtoken');
const checkToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    }
    else {
        res.sendStatus(401);
    }
};
exports.checkToken = checkToken;
const verifyAndAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
    if (decoded !== null)
        req.user = yield User_1.User.findOne({ where: { email: decoded.email } });
    else {
        let err = new Error("invalid key");
        next(err);
    }
    next();
});
exports.verifyAndAuthenticate = verifyAndAuthenticate;
const errorHandler = (err, req, res, next) => {
    res.status(500).send({ error: err.message });
};
exports.errorHandler = errorHandler;
