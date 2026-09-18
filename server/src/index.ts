import { createApp } from "./app.js";

const app = await createApp();
const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

await app.listen({ port, host });
