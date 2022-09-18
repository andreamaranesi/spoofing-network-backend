import { ConcreteErrorFactory } from "../factory/ErrorFactory";
import { User } from "../models/User";
const jwt = require("jsonwebtoken");

// check the Authorization token is not empty
export const checkToken = (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    try {
      const bearerToken = bearerHeader.split(" ")[1];
      req.token = bearerToken;
      next();
    } catch (error) {
      next(new Error("token invalid"));
    }
  } else next(new Error("token absent"));
};

// validate the token key and the expiration
export const verifyAndAuthenticate = async (req, res, next) => {
  try {
    let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
    req.user = await User.findOne({ where: { email: decoded.email } });

    // check if user exists
    if (req.user === null)
      next(new Error(`user with email ${req.user.email} doesn't exist`));
    else next();
  } catch (error) {
    if (typeof error === "object")
      if (error.name == "TokenExpiredError")
        new ConcreteErrorFactory()
          .createAuthentication()
          .setTokenExpired()
          .send(res);
      else next(new Error(error.message));
    else next(new Error(error));
  }
};

// validate the token amount of the default user
export const verifyTokenAmount = async (req, res, next) => {
  if (req.user.token == 0 && !req.user.isAdmin) {
    new ConcreteErrorFactory().createAuthentication().setTokenZero().send(res);
  } else next();
};

// send back the error message
export const authenticationErrorHandler = (err, req, res, next) => {
  new ConcreteErrorFactory().createAuthentication().set(err.message).send(res);
};

// check if the user is the admin
export const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin)
    new ConcreteErrorFactory().createAuthentication().setNotAdmin().send(res);
  else next();
};
