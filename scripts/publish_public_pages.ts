import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { storagePut } from "../server/storage";

const projectRoot = "/home/ubuntu/focus-flow";
const pages = ["privacy", "support", "terms"] as const;

async function main() {
  const published: Record<string, string> = {};

  for (const page of pages) {
    const localPath = join(projectRoot, "release", "public-pages", `${page}.html`);
    const content = await readFile(localPath, "utf8");
    const { url } = await storagePut(`focus-flow/public-pages/${page}.html`, content, "text/html; charset=utf-8");
    published[page] = url;
  }

  const output = `${JSON.stringify(published, null, 2)}\n`;
  await writeFile(join(projectRoot, "release", "public-pages", "published-urls.json"), output, "utf8");
  console.log(output);
}

void main();
