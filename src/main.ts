import * as core from "@actions/core";

import * as skaffold from "./skaffold";

async function run(): Promise<void> {
  const requestedVersion = core.getInput("version");

  const token = core.getInput("github-token");

  core.info(`Requested version of Skaffold is "${requestedVersion}"`);

  const version = await skaffold.getVersion(requestedVersion, token);

  core.info(`Using version ${version}`);

  core.info(`Fetching binary...`);

  const binaryPath = await skaffold.fetch(version);

  core.info(`Installing binary...`);

  await skaffold.install(binaryPath);

  core.info(`Skaffold is ready to use`);
}

run().catch(core.setFailed);
