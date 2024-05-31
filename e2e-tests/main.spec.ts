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

test("Renders the first page", async () => {
	page = await electronApp.firstWindow();
	const title = await page.title();
	expect(title).toBe("Anytype");
});

test("Enter my Vault", async () => {
	//Step create new vault
	await page.getByText("AuthSelectSignup").click();
	//Step get my key
	await page.getByText("AuthOnboardVaultButton").click();
	await page.getByText("AuthOnboardPhraseSubmit").click();
	//Step save the key
	await page.click(".icon.copy");
	// Retrieve clipboard content
	const copiedText = await page.evaluate(async () => {
		return await navigator.clipboard.readText();
	});
	// Save the copied text to storage
	storage["vaultKey"] = copiedText;
	console.log("Copied text:", storage["vaultKey"]);
	page.getByText("toast copy");
	await delay(3000);
	await page.getByText("commonNext").click();
	//Step choose the name and enter the vault
	await page.getByPlaceholder("defaultNamePage").fill("Friedolin");
	await page.getByText("authOnboardSoulButton").click();
	page.getByText("popipConfirmWelcomeButton");
});

test("Log out", async () => {
	await delay(2000);
	await clickMenuItemById(electronApp, "vault");
	await page.click('div.label[data-content="popupSettingsLogout"]');
	await page.locator("#sideRight").getByText("popupSettingsLogout").click();
});

test("Log in as existing user", async () => {
	await delay(2000);
	await page.getByText("authSelectLogin").click();
	await page.locator(".phraseInnerWrapper").click();
	await page.locator("#entry").type(storage["vaultKey"]);
	await page.keyboard.press("Space");
	await page.getByText("authLoginSubmit").click();
	page.locator("#path").getByText("Homepage");
});

test("Create new Personal Project space", async () => {
	await delay(2000);
	await clickMenuItemById(electronApp, "newSpace");
	await page.locator("#select-select-usecase").click();
	await page.getByText("usecase2Title", { exact: true }).click();
	await page.getByText("commonCreate", { exact: true }).click();
	await expect(page).toHaveTitle(/.*usecase2Title*/);
	await delay(2000);
	await clickMenuItemById(electronApp, "vault");
	await page.click('div.label[data-content="popupSettingsLogout"]');
	await page.locator("#sideRight").getByText("popupSettingsLogout").click();
});

test("Try to log in with non-existing key", async () => {
	await delay(2000);
	await page.getByText("authSelectLogin").click();
	await page.locator(".phraseInnerWrapper").click();
	await page.locator("#entry").type(reverseString(storage["vaultKey"]));
	await page.keyboard.press("Space");
	await page.getByText("authLoginSubmit").click();
	const errorElement = page.locator("div.error.animation");
	await expect(errorElement).toHaveText("pageAuthLoginInvalidPhrase");
});
