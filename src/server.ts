import { resolve, sep } from "node:path";

const DIST = resolve(import.meta.dir, "../dist");

async function serveFile(root: string, rel: string): Promise<Response> {
  const path = resolve(root, rel);
  if (!path.startsWith(root + sep))
    return new Response("Forbidden", { status: 403 });
  const file = Bun.file(path);
  return (await file.exists())
    ? new Response(file)
    : new Response("Not Found", { status: 404 });
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4180),
  hostname: "127.0.0.1",
  fetch(req) {
    const { pathname } = new URL(req.url);
    return serveFile(
      DIST,
      pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1)),
    );
  },
});
console.log(`toybox on http://localhost:${server.port}`);
