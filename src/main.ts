import * as core from "@actions/core";

import * as skaffold from "./skaffold";

async function run(): Promise<void> {
  const requestedVersion = core.getInput("version");

  core.info(`Requested version "${requestedVersion}"`);

  const version = await skaffold.getVersion(requestedVersion);

  core.info(`Using version ${version}`);

  core.info(`Fetching binary...`);

  const binary = await skaffold.fetchBinary(version);

  core.info(`Verifying binary...`);

  if (!(await skaffold.verifyBinary(binary))) {
    throw Error("Skaffold binary did not match its checksum");
  }

  core.info(`Installing binary...`);

  await skaffold.installBinary(binary);

  core.info(`Skaffold has been installed`);
}

run().catch(core.setFailed);
