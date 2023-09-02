import type { Config } from "@jest/types";

const jestConfig: Config.InitialOptions = {
  testTimeout: 120000,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};

export default jestConfig;
