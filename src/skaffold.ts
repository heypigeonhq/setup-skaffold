import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import streamPromises from "stream/promises";

import * as toolCache from "@actions/tool-cache";

import * as github from "./github";
import * as host from "./host";
import Binary from "./skaffold/Binary";

/**
 * Fetch the Skaffold binary for the given version from either the local cache
 * or the GitHub release.
 *
 * @param version version of Skaffold to fetch
 */
export async function fetchBinary(version: string): Promise<Binary> {
  const binaryFilename = getBinaryFilename();

  const cachePath = toolCache.find("skaffold", version, os.arch());

  const checksumFilename = `${binaryFilename}.sha256`;

  let binaryPath = path.join(cachePath, binaryFilename);

  let checksumPath = path.join(cachePath, checksumFilename);

  if (!cachePath) {
    const binaryURL = getBinaryURL(version);

    binaryPath = await toolCache.downloadTool(binaryURL);

    checksumPath = await toolCache.downloadTool(`${binaryURL}.sha256`);

    await toolCache.cacheFile(
      binaryPath,
      binaryFilename,
      "skaffold",
      version,
      host.getArch(),
    );

    await toolCache.cacheFile(
      checksumPath,
      checksumFilename,
      "skaffold",
      version,
      host.getArch(),
    );
  }

  const checksum = await fsPromises.readFile(checksumPath, "utf8");

  return {
    checksum: checksum.trim(),
    filename: binaryFilename,
    path: binaryPath,
  } as Binary;
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

  return `https://github.com/GoogleContainerTools/skaffold/releases/download/v${version}/${filename}`;
}

/**
 * Get the version of Skaffold.
 *
 * If the version requested is "latest" then the most recent released version
 * of K3s will be returned. Otherwise, return `requestedVersion`.
 *
 * @param requestedVersion version of K3s requested
 */
export async function getVersion(requestedVersion: string): Promise<string> {
  let version = requestedVersion;

  if (version === "latest") {
    const release = await github.getLatestRelease(
      "GoogleContainerTools/skaffold",
    );

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
 * @param binary binary to install
 */
export async function installBinary(binary: Binary): Promise<void> {
  await fsPromises.chmod(binary.path, 0o500);

  await fsPromises.copyFile(
    binary.path,
    path.join("/usr/local/bin", "skaffold"),
  );
}

/**
 * Verify the checksum of the Skaffold binary.
 *
 * @param binary binary to verify
 */
export async function verifyBinary(binary: Binary): Promise<boolean> {
  const hash = crypto.createHash("sha256");

  const binaryStream = fs.createReadStream(binary.path);

  binaryStream.pipe(hash);

  await streamPromises.finished(binaryStream);

  const expectedChecksum = `${hash.digest("hex")}  ${binary.filename}`;

  return expectedChecksum === binary.checksum;
}
