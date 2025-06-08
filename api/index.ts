// api/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../src/server";

let cachedServer: Awaited<ReturnType<typeof createServer>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedServer) {
    cachedServer = await createServer();
    await cachedServer.initialize();
  }

  // Pakai server.listener langsung!
  cachedServer.listener.emit("request", req, res);
}
