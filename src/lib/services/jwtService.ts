/* eslint-disable no-useless-catch */
// lib/services/jwtService.ts
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

interface TokenPayload {
    uuid: string;
    username: string;
    role: string;
}

const generateToken = (payload: TokenPayload, options?: SignOptions): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h", ...options });
};

const verifyToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    throw err;
  }
};

export { generateToken, verifyToken, TokenPayload };
