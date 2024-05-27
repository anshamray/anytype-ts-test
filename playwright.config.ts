import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
	testDir: "./e2e-tests",
	maxFailures: 2,
	timeout: 5 * 60 * 10000,
};

export default config;
