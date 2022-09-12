import {
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  ServerError,
  StatusCode,
} from "./StatusCode";

export interface ErrorFactory {
  createAuthentication(): StatusCode;

  createBadRequest(): StatusCode;

  createServer(): StatusCode;

  createForbidden(): StatusCode;
}

export class ConcreteErrorFactory implements ErrorFactory {
  createAuthentication(): AuthenticationError {
    return new AuthenticationError();
  }

  createBadRequest(): BadRequestError {
    return new BadRequestError();
  }

  createServer(): ServerError {
    return new ServerError();
  }

  createForbidden(): ForbiddenError {
    return new ForbiddenError();
  }
}
