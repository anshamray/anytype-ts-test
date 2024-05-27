import { test } from "@playwright/test";
import { expect } from "@playwright/test";
import {
	clickMenuItemById,
	parseElectronApp,
} from "electron-playwright-helpers";
import { ElectronApplication, Page, _electron as electron } from "playwright";

let electronApp: ElectronApplication;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function reverseString(str) {
	return str.split("").reverse().join("");
}

const storage = {};

test.beforeAll(async () => {
	// parse the directory and find paths and other info
	const electronAppPath =
		process.env.ELECTRON_APP_PATH ||
		"/home/shamray/workspace/anytype/anytype-ts/dist/linux-unpacked";
	const appInfo = parseElectronApp(electronAppPath);
	// set the CI environment variable to true
	process.env.CI = "e2e";
	electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
	});

	electronApp.on("window", async (page) => {
		const filename = page.url()?.split("/").pop();
		console.log(`Window opened: ${filename}`);

		// capture errors
		page.on("pageerror", (error) => {
			console.error(error);
		});
		// capture console messages
		page.on("console", (msg) => {
			console.log(msg.text());
		});
	});
});

test.afterAll(() => {});

let page: Page;

test("renders the first page", async () => {
	page = await electronApp.firstWindow();
	const title = await page.title();
	expect(title).toBe("Anytype");
});

test("Enter my Vault", async () => {
	//Step create new vault
	await page.getByText("New Vault").click();
	//Step get my key
	await page.getByText("Get my Key").click();
	await page.getByText("Show my Key").click();
	//Step save the key
	await page.click(".icon.copy");
	// Retrieve clipboard content
	const copiedText = await page.evaluate(async () => {
		return await navigator.clipboard.readText();
	});
	// Save the copied text to storage
	storage["vaultKey"] = copiedText;
	console.log("Copied text:", storage["vaultKey"]);
	page.getByText("Key has been copied to");
	await delay(3000);
	await page.getByText("Next").click();
	//Step choose the name and enter the vault
	await page.getByPlaceholder("Untitled").fill("Friedolin");
	await page.getByText("Enter my Vault").click();
	page.getByText("Welcome to your Space");
});

test("Log out", async () => {
	await clickMenuItemById(electronApp, "vault");
	await page.click('div.label[data-content="Log out"]');
	await page.locator("#sideRight").getByText("Log out").click();
});

test("Log in as existing user", async () => {
	await delay(2000);
	await page.getByText("I have a Key").click();
	await page.locator(".phraseInnerWrapper").click();
	await page.locator("#entry").type(storage["vaultKey"]);
	await page.keyboard.press("Space");
	await page.getByText("Enter my Vault").click();
	page.locator("#path").getByText("Homepage");
});

test("Create new Personal Project space", async () => {
	await delay(2000);
	await clickMenuItemById(electronApp, "newSpace");
	await page.locator("#select-select-usecase").click();
	await page.getByText("Personal projects", { exact: true }).click();
	await page.getByText("Create", { exact: true }).click();
	await expect(page).toHaveTitle(/.*Personal projects.*/);
	await delay(2000);
	await clickMenuItemById(electronApp, "vault");
	await page.click('div.label[data-content="Log out"]');
	await page.locator("#sideRight").getByText("Log out").click();
});

test("Try to log in with non-existing key", async () => {
	await delay(2000);
	await page.getByText("I have a Key").click();
	await page.locator(".phraseInnerWrapper").click();
	await page.locator("#entry").type(reverseString(storage["vaultKey"]));
	await page.keyboard.press("Space");
	await page.getByText("Enter my Vault").click();
	const errorElement = page.locator("div.error.animation");
	await expect(errorElement).toHaveText("Invalid Key");
});
