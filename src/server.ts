import * as dotenv from "dotenv";
dotenv.config();

import Hapi, { Request, ResponseToolkit } from "@hapi/hapi";
import { routes } from "./routes/apiRoutes";

const server = Hapi.server({
  host: "0.0.0.0",
  port: 3000,
  routes: {
    cors: {
      origin: ["*"],
      additionalHeaders: ["x-api-key", "content-type", "authorization"],
      additionalExposedHeaders: ["x-api-key"],
    },
  },
});

server.route(routes);

const VALID_API_KEY = process.env.KunciRumah;

server.ext("onRequest", (request: Request, h: ResponseToolkit) => {
  console.log(
    `Incoming request: ${request.method.toUpperCase()} ${request.path}`
  );

  if (request.method === "options") {
    return h.continue;
  }

  const apiKey = request.headers["x-api-key"];

  if (!apiKey || apiKey !== VALID_API_KEY) {
    return h.response({ error: "Invalid API Key" }).code(403).takeover();
  }

  return h.continue;
});

server.ext("onPreResponse", (request: Request, h: ResponseToolkit) => {
  const response = request.response;
  if ((response as any).isBoom) {
    console.error("Error occurred:", (response as any).output.payload);
  }
  return h.continue;
});

// Export handler buat Vercel
export default server.listener;
