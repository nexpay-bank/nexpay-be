import serverless from "serverless-http";
import { createServer } from "../src/server";

let handler: any;

export default async function (req: any, res: any) {
  if (!handler) {
    const server = await createServer();
    await server.initialize();
    handler = serverless(server.listener, { framework: "hapi" });
  }
  return handler(req, res);
}
