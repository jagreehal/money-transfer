import { spawn } from "node:child_process";

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

function getFlagValue(args, flagName) {
  const index = args.indexOf(flagName);
  if (index === -1) return undefined;
  return args[index + 1];
}

function isHelp(args) {
  return args.includes("--help") || args.includes("-h") || args.length === 0;
}

async function runWebDeploy(stage) {
  const webDir = "apps/web";

  if (stage === "production") {
    await run("pnpm", ["run", "deploy:prod"], { cwd: webDir });
    return;
  }

  if (stage === "staging") {
    await run("pnpm", ["run", "deploy:staging"], { cwd: webDir });
    return;
  }

  await run("pnpm", ["run", "build"], { cwd: webDir });
  const branch = stage ?? "main";
  await run(
    "wrangler",
    ["pages", "deploy", "dist", "--project-name=money-transfer-web", "--branch", branch],
    { cwd: webDir },
  );
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "deploy" && isHelp(args)) {
    await run("wrangler-deploy", ["--help"]);
    return;
  }

  await run("wrangler-deploy", args);

  if (command !== "deploy" || isHelp(args)) {
    return;
  }

  const stage = getFlagValue(args, "--stage");
  await runWebDeploy(stage);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
