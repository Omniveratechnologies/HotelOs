import { protocol, net } from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function registerAppProtocol(rendererDir: string): void {
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith("/")) {
      pathname = pathname.slice(1);
    }
    const filePath = path.join(rendererDir, pathname);

    if (pathname && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return net.fetch(pathToFileURL(filePath).toString());
    }

    return net.fetch(
      pathToFileURL(path.join(rendererDir, "index.html")).toString(),
    );
  });
}
