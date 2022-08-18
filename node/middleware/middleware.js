export const checkHeader = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    next();
  } else {
    let err = new Error("ahi ahi no auth header");
    next(err);
  }
};

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

export const verifyAndAuthenticate = (req, res, next) => {
  let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
  if (decoded !== null) req.user = decoded;
  else {
    let err = new Error("invalid key");
    next(err);
  }

  next();
};

export const errorHandler = (err, req, res, next) => {
  res.status(500).send({ error: err.message });
};