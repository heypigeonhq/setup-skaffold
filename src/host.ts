import os from "os";

/**
 * Returns the CPU architecture of the host.
 */
export function getArch(): string {
  const arch = os.arch();

  if (arch === "x64") {
    return "amd64";
  }

  return arch;
}

/**
 * Returns the OS platform of the host.
 */
export function getPlatform(): string {
  const platform = os.platform();

  if (platform === "win32") {
    return "windows";
  }

  return platform;
}
