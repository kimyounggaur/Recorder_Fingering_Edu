import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const phase = process.argv[2];
if (!/^p\d+(?:-[a-z]+)?$/.test(phase ?? "")) throw new Error("Expected phase p0..p13");
const directory = `output/verification/${phase}`;
mkdirSync(directory, { recursive: true });
const results = [];
for (const script of ["typecheck", "lint", "test", "build", "build:vercel", "test:e2e"]) {
  const start = Date.now();
  const result = spawnSync("npm", ["run", script], {
    shell: process.platform === "win32",
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const entry = { script, exitCode: result.status, elapsedMs: Date.now() - start };
  results.push(entry);
  writeFileSync(`${directory}/${script.replaceAll(":", "-")}.log`, output);
  writeFileSync(`${directory}/results.json`, JSON.stringify(results, null, 2));
  console.log(`${phase}: ${script} ${result.status === 0 ? "PASS" : "FAIL"} (${entry.elapsedMs}ms)`);
  if (result.status !== 0) {
    console.log(output.slice(-14000));
    process.exit(result.status ?? 1);
  }
}
