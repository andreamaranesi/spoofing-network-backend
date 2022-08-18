import { User } from "../models/User";
const jwt = require('jsonwebtoken');


export const checkToken = (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(401);
  }
};

export const verifyAndAuthenticate = async (req, res, next) => {
  let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
  if (decoded !== null) req.user = await User.findOne({ where: { email: decoded.email } });
  else {
    let err = new Error("invalid key");
    next(err);
  }

  next();
};

export const errorHandler = (err, req, res, next) => {
  res.status(500).send({ error: err.message });
};
