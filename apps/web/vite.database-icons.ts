import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/** Serve client-extracted item PNGs in dev/preview without copying 40k files into public/. */
export function databaseIconsPlugin(iconsDir: string): Plugin {
  const root = path.resolve(iconsDir);

  function attach(
    middlewares: {
      use: (fn: (req: { url?: string }, res: {
        statusCode: number;
        setHeader: (k: string, v: string) => void;
        end: (body?: string) => void;
      }, next: () => void) => void) => void;
    },
  ) {
    middlewares.use((req, res, next) => {
      const url = req.url ?? "";
      const match = url.match(/^\/database\/icons\/(\d+)\.(png|dds)(?:\?.*)?$/i);
      if (!match) {
        next();
        return;
      }
      const file = path.join(root, `${match[1]}.${match[2].toLowerCase()}`);
      if (!file.startsWith(root) || !fs.existsSync(file)) {
        res.statusCode = 404;
        res.end("icon not found");
        return;
      }
      res.setHeader(
        "Content-Type",
        match[2].toLowerCase() === "png"
          ? "image/png"
          : "application/octet-stream",
      );
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(file).pipe(res as unknown as NodeJS.WritableStream);
    });
  }

  return {
    name: "hiperxp-database-icons",
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}
