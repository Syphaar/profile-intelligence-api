import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const assertTokenSecrets = () => {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error("Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET");
  }
};

export const generateAccessToken = (user) => {
  assertTokenSecrets();

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email
    },
    ACCESS_SECRET,
    { expiresIn: "3m" }
  );
};

export const generateRefreshToken = (user) => {
  assertTokenSecrets();

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      jti: randomUUID()
    },
    REFRESH_SECRET,
    { expiresIn: "5m" }
  );
};

export const verifyAccessToken = (token) => {
  assertTokenSecrets();
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  assertTokenSecrets();
  return jwt.verify(token, REFRESH_SECRET);
};
