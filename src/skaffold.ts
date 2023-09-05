import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import streamPromises from "stream/promises";

import * as toolCache from "@actions/tool-cache";

import * as github from "./github";
import * as host from "./host";

const repo = "GoogleContainerTools/skaffold";

/**
 * Fetch the Skaffold binary for the given version.
 *
 * @param version version of the Skaffold release archive to fetch
 */
export async function fetch(version: string): Promise<string> {
  const binaryPath = await fetchBinary(version);

  const binaryFilename = getBinaryFilename();

  const checksumFile = await fetchChecksum(version);

  const checksumHash = await createChecksumHash(binaryPath);

  const checksum = `${checksumHash}  ${binaryFilename}`;

  const checksums = await fsPromises.readFile(checksumFile, "utf8");

  if (!checksums.includes(checksum)) {
    throw new Error(
      `Failed to fetch Skaffold v${version}: unexpected checksum for ${binaryFilename}`,
    );
  }

  return binaryPath;
}

async function fetchBinary(version: string): Promise<string> {
  return await fetchTool("skaffoldBinary", version, getBinaryFilename());
}

async function fetchChecksum(version: string): Promise<string> {
  const filename = `${getBinaryFilename()}.sha256`;

  return await fetchTool("skaffoldChecksum", version, filename);
}

async function fetchTool(
  toolName: string,
  version: string,
  filename: string,
): Promise<string> {
  const arch = host.getArch();

  let cachePath = toolCache.find(toolName, version, arch);

  if (!cachePath) {
    const url = `https://github.com/${repo}/releases/download/v${version}/${filename}`;

    const filePath = await toolCache.downloadTool(url);

    cachePath = await toolCache.cacheFile(
      filePath,
      filename,
      toolName,
      version,
      arch,
    );
  }

  return `${cachePath}/${filename}`;
}

async function createChecksumHash(filePath: string): Promise<string> {
  const hash = crypto.createHash("sha256");

  const fileStream = fs.createReadStream(filePath);

  fileStream.pipe(hash);

  await streamPromises.finished(fileStream);

  return hash.digest("hex");
}

/**
 * Returns the filename of the Skaffold binary.
 */
export function getBinaryFilename(): string {
  const arch = host.getArch();

  const platform = host.getPlatform();

  let filename = `skaffold-${platform}-${arch}`;

  if (platform === "windows") filename += ".exe";

  return filename;
}

/**
 * Returns the URL to the Skaffold binary.
 *
 * @param version version of Skaffold to download
 */
export function getBinaryURL(version: string): string {
  const filename = getBinaryFilename();

  return `https://github.com/${repo}/releases/download/v${version}/${filename}`;
}

/**
 * Get the version of Skaffold.
 *
 * If the version requested is "latest" then the most recent released version
 * of Skaffold will be returned. Otherwise, return `requestedVersion`.
 *
 * @param requestedVersion version of Skaffold requested
 */
export async function getVersion(requestedVersion: string): Promise<string> {
  let version = requestedVersion;

  if (version === "latest") {
    const release = await github.getLatestRelease(repo);

    version = release.tagName.replace(/^v/, "");
  }

  return version;
}

/**
 * Install the Skaffold binary.
 *
 * This will copy the binary to `/usr/local/bin/skaffold` and set the
 * permissions so that it is executable.
 *
 * @param binaryPath path to the Skaffold binary
 */
export async function install(binaryPath: string): Promise<string> {
  const installPath = "/usr/local/bin/skaffold";

  await fsPromises.chmod(binaryPath, 0o500);
  await fsPromises.copyFile(binaryPath, installPath);

  return installPath;
}
