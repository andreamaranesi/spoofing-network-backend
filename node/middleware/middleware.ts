import { User } from "../models/User";
const jwt = require("jsonwebtoken");

 // check the Authorization token is not empty
export const checkToken = (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else next(new Error("token absent"));
};

// validate the token key and the expiration
export const verifyAndAuthenticate = async (req, res, next) => {
  try {
    let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
    req.user = await User.findOne({ where: { email: decoded.email } });
  } catch (error) {
    if (typeof error === "object")
      if (error.name == "TokenExpiredError")
        res.status(403).send({ error: "Token Expired" });
      else res.status(403).send({ error: error.message });
    else next(new Error(error));
  }

  next();
};

// send back the error message
export const errorHandler = (err, req, res, next) => {
  res.status(500).send({ error: err.message });
};
