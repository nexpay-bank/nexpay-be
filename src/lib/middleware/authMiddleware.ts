/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyToken, TokenPayload } from "../services/jwtService";
import { Request, ResponseToolkit, ResponseObject } from "@hapi/hapi";

const authMiddleware = async (
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | symbol> => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return h
      .response({ error: "Unauthorized: Token missing" })
      .code(401)
      .takeover();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as TokenPayload;

    // Assign ke credentials, bukan ke auth langsung
    request.auth.credentials = {
      uuid: decoded.uuid,
      name: decoded.username,
      role: decoded.role,
    };

    return h.continue;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return h
        .response({ error: "Expired: Token expired" })
        .code(401)
        .takeover();
    }
    return h
      .response({ error: "Unauthorized: Invalid token" })
      .code(401)
      .takeover();
  }
};

export default authMiddleware;
