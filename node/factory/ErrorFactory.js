"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcreteErrorFactory = void 0;
const StatusCode_1 = require("./StatusCode");
class ConcreteErrorFactory {
    createAuthentication() {
        return new StatusCode_1.AuthenticationError();
    }
    createBadRequest() {
        return new StatusCode_1.BadRequestError();
    }
    createServer() {
        return new StatusCode_1.ServerError();
    }
    createForbidden() {
        return new StatusCode_1.ForbiddenError();
    }
}
exports.ConcreteErrorFactory = ConcreteErrorFactory;
