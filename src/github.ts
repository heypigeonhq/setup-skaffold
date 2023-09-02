import * as core from "@actions/core";
import fetch from "node-fetch";

import { GitHubRelease, GitHubReleaseResponse } from "./github/Release";
import { GitHubRequestError } from "./github/RequestError";

/**
 * Get the latest release for the given repository.
 *
 * @param repo repository to get the latest release for. Must be in the form of
 * `owner/repo`.
 */
export async function getLatestRelease(repo: string): Promise<GitHubRelease> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;

  const response = await fetch(url);

  if (response.status <= 399) {
    const responseBody = (await response.json()) as GitHubReleaseResponse;

    return { tagName: responseBody.tag_name };
  }

  const requestError = (await response.json()) as GitHubRequestError;

  core.error(
    `Failed to fetch latest GitHub release for repo "${repo}". Reason: ${requestError.message}`,
  );

  throw new Error();
}
