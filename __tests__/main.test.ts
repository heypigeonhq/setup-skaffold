import path from "path";

import { Act } from "@kie/act-js";
import { MockGithub } from "@kie/mock-github";

let github: MockGithub;

beforeEach(async () => {
  github = new MockGithub({
    repo: {
      setupSkaffold: {
        files: [
          {
            dest: ".github/workflows/workflow.yaml",
            src: path.join(__dirname, "workflow.yaml"),
          },
          {
            dest: "action.yaml",
            src: path.join(__dirname, "..", "action.yaml"),
          },
          {
            dest: "dist",
            src: path.resolve(__dirname, "..", "dist/"),
          },
        ],
      },
    },
  });

  await github.setup();
});

afterEach(async () => {
  await github.teardown();
});

test("it works", async () => {
  const act = new Act(github.repo.getPath("setupSkaffold"));

  const result = await act.runEvent("push");

  expect(result).toStrictEqual([expect.objectContaining({ status: 0 })]);
});
