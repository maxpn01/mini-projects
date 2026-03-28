import { chromium, firefox, webkit } from "playwright-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_TARGET = "https://example.com/moodle/course/section.php?id=123";
const DEFAULT_PROFILE = "auto";
const DEFAULT_CONCURRENCY = 6;
const DEFAULT_VISIT_MS = 1800;
const DEFAULT_SCAN_DELAY_MS = 1200;
const DEFAULT_LOGIN_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_COPY_PROFILE = true;

const BROWSER_TYPES = {
  chromium,
  firefox,
  webkit,
};

const BROWSER_MATRIX = {
  win32: [
    {
      name: "Brave",
      engine: "chromium",
      ids: ["BraveHTML"],
      browserPath:
        "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
      alternateBrowserPaths: [
        "C:/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
      ],
      userDataDir: "~/AppData/Local/BraveSoftware/Brave-Browser/User Data",
      defaultProfile: "Default",
    },
    {
      name: "Edge",
      engine: "chromium",
      ids: ["MSEdgeHTM"],
      browserPath:
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      alternateBrowserPaths: [
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
      ],
      userDataDir: "~/AppData/Local/Microsoft/Edge/User Data",
      defaultProfile: "Default",
    },
    {
      name: "Chrome",
      engine: "chromium",
      ids: ["ChromeHTML"],
      browserPath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      alternateBrowserPaths: [
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      ],
      userDataDir: "~/AppData/Local/Google/Chrome/User Data",
      defaultProfile: "Default",
    },
    {
      name: "Chromium",
      engine: "chromium",
      ids: ["ChromiumHTM"],
      browserPath: "C:/Program Files/Chromium/Application/chrome.exe",
      userDataDir: "~/AppData/Local/Chromium/User Data",
      defaultProfile: "Default",
    },
    {
      name: "Firefox",
      engine: "firefox",
      ids: ["FirefoxURL", "FirefoxHTML"],
      browserPath: "C:/Program Files/Mozilla Firefox/firefox.exe",
      alternateBrowserPaths: [
        "C:/Program Files (x86)/Mozilla Firefox/firefox.exe",
      ],
      userDataDir: "~/AppData/Roaming/Mozilla/Firefox",
      defaultProfile: "auto",
      caveat:
        "Firefox is launched through Playwright's Firefox engine. Installed Firefox builds can be less reliable than Playwright's patched Firefox.",
    },
  ],
  darwin: [
    {
      name: "Brave",
      engine: "chromium",
      ids: ["com.brave.Browser"],
      browserPath:
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
      defaultProfile: "Default",
    },
    {
      name: "Edge",
      engine: "chromium",
      ids: ["com.microsoft.edgemac"],
      browserPath:
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      userDataDir: "~/Library/Application Support/Microsoft Edge",
      defaultProfile: "Default",
    },
    {
      name: "Chrome",
      engine: "chromium",
      ids: ["com.google.Chrome"],
      browserPath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      userDataDir: "~/Library/Application Support/Google/Chrome",
      defaultProfile: "Default",
    },
    {
      name: "Chromium",
      engine: "chromium",
      ids: ["org.chromium.Chromium"],
      browserPath: "/Applications/Chromium.app/Contents/MacOS/Chromium",
      userDataDir: "~/Library/Application Support/Chromium",
      defaultProfile: "Default",
    },
    {
      name: "Firefox",
      engine: "firefox",
      ids: ["org.mozilla.firefox"],
      browserPath: "/Applications/Firefox.app/Contents/MacOS/firefox",
      userDataDir: "~/Library/Application Support/Firefox",
      defaultProfile: "auto",
      caveat:
        "Firefox is launched through Playwright's Firefox engine. Installed Firefox builds can be less reliable than Playwright's patched Firefox.",
    },
    {
      name: "Safari",
      engine: "webkit",
      ids: ["com.apple.Safari"],
      browserPath: null,
      userDataDir: null,
      defaultProfile: "auto",
      displayName: "Safari via WebKit",
      caveat:
        "Playwright cannot automate Safari.app directly, so Safari defaults are run through Playwright WebKit instead.",
    },
  ],
  linux: [
    {
      name: "Brave",
      engine: "chromium",
      ids: ["brave-browser.desktop"],
      browserPath: "brave-browser",
      userDataDir: "~/.config/BraveSoftware/Brave-Browser",
      defaultProfile: "Default",
    },
    {
      name: "Edge",
      engine: "chromium",
      ids: ["microsoft-edge.desktop"],
      browserPath: "microsoft-edge",
      userDataDir: "~/.config/microsoft-edge",
      defaultProfile: "Default",
    },
    {
      name: "Chrome",
      engine: "chromium",
      ids: ["google-chrome.desktop"],
      browserPath: "google-chrome",
      userDataDir: "~/.config/google-chrome",
      defaultProfile: "Default",
    },
    {
      name: "Chromium",
      engine: "chromium",
      ids: ["chromium.desktop", "chromium-browser.desktop"],
      browserPath: "chromium",
      alternateBrowserPaths: ["chromium-browser"],
      userDataDir: "~/.config/chromium",
      defaultProfile: "Default",
    },
    {
      name: "Firefox",
      engine: "firefox",
      ids: ["firefox.desktop", "org.mozilla.firefox.desktop"],
      browserPath: "firefox",
      userDataDir: "~/.mozilla/firefox",
      defaultProfile: "auto",
      caveat:
        "Firefox is launched through Playwright's Firefox engine. Installed Firefox builds can be less reliable than Playwright's patched Firefox.",
    },
  ],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function expandHome(inputPath) {
  if (!inputPath) {
    return inputPath;
  }

  if (inputPath === "~") {
    return os.homedir();
  }

  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  return inputPath;
}

function pathExists(filePath) {
  return Boolean(filePath) && fs.existsSync(expandHome(filePath));
}

function resolveBinary(binaryName) {
  const command = process.platform === "win32" ? "where" : "which";

  try {
    const output = execSync(`${command} ${binaryName}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)[0];

    return output || null;
  } catch {
    return null;
  }
}

function resolveBrowserExecutable(candidate) {
  if (!candidate.browserPath) {
    return null;
  }

  if (pathExists(candidate.browserPath)) {
    return expandHome(candidate.browserPath);
  }

  const directBinary = resolveBinary(candidate.browserPath);
  if (directBinary) {
    return directBinary;
  }

  for (const alternatePath of candidate.alternateBrowserPaths ?? []) {
    if (pathExists(alternatePath)) {
      return expandHome(alternatePath);
    }

    const resolved = resolveBinary(alternatePath);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function printBanner() {
  console.log(String.raw`
 __  __                 _ _        ____ _ _      _             
|  \/  | ___   ___   __| | | ___  / ___| (_) ___| | _____ _ __ 
| |\/| |/ _ \ / _ \ / _  | |/ _ \| |   | | |/ __| |/ / _ \ '__|
| |  | | (_) | (_) | (_| | |  __/| |___| | | (__|   <  __/ |   
|_|  |_|\___/ \___/ \__,_|_|\___| \____|_|_|\___|_|\_\___|_|   
`);
  console.log("A quiet little helper for repetitive Moodle clicks");
  console.log("  - asks for a course section URL");
  console.log("  - opens the page using your default browser");
  console.log("  - visits numbered activities still marked as 'To do'");
  console.log("  - moves through the sections until the last course page");
  console.log("");
  console.log("Prerequisites:");
  console.log("  - Node.js + playwright-core dependency");
  console.log(
    "  - A supported browser installed: Chromium-family browser, Firefox, or Safari on macOS",
  );
  console.log("");
}

function parseArgs(argv) {
  const options = {
    target: DEFAULT_TARGET,
    userDataDir: null,
    browserPath: null,
    browserEngine: null,
    profile: DEFAULT_PROFILE,
    concurrency: DEFAULT_CONCURRENCY,
    visitMs: DEFAULT_VISIT_MS,
    scanDelayMs: DEFAULT_SCAN_DELAY_MS,
    loginTimeoutMs: DEFAULT_LOGIN_TIMEOUT_MS,
    copyProfile: DEFAULT_COPY_PROFILE,
    headless: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--headless") {
      options.headless = true;
      continue;
    }

    if (arg === "--copy-profile") {
      options.copyProfile = true;
      continue;
    }

    if (arg === "--no-copy-profile") {
      options.copyProfile = false;
      continue;
    }

    if (!arg.startsWith("--")) {
      options.target = arg;
      continue;
    }

    const [key, inlineValue] = arg.split("=");
    const nextValue = inlineValue ?? argv[index + 1];
    const consumesNext = inlineValue == null;

    switch (key) {
      case "--target":
        options.target = nextValue;
        break;
      case "--user-data-dir":
        options.userDataDir = nextValue;
        break;
      case "--browser-path":
        options.browserPath = nextValue;
        break;
      case "--browser-engine":
        options.browserEngine = nextValue;
        break;
      case "--profile":
        options.profile = nextValue;
        break;
      case "--concurrency":
        options.concurrency = Number.parseInt(nextValue, 10);
        break;
      case "--visit-ms":
        options.visitMs = Number.parseInt(nextValue, 10);
        break;
      case "--scan-delay-ms":
        options.scanDelayMs = Number.parseInt(nextValue, 10);
        break;
      case "--login-timeout-ms":
        options.loginTimeoutMs = Number.parseInt(nextValue, 10);
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }

    if (consumesNext) {
      index += 1;
    }
  }

  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }

  if (!Number.isFinite(options.visitMs) || options.visitMs < 0) {
    throw new Error("--visit-ms must be a non-negative integer");
  }

  if (!Number.isFinite(options.scanDelayMs) || options.scanDelayMs < 0) {
    throw new Error("--scan-delay-ms must be a non-negative integer");
  }

  if (
    !Number.isFinite(options.loginTimeoutMs) ||
    options.loginTimeoutMs < 1000
  ) {
    throw new Error("--login-timeout-ms must be at least 1000");
  }

  if (
    options.browserEngine &&
    !["chromium", "firefox", "webkit"].includes(options.browserEngine)
  ) {
    throw new Error(
      "--browser-engine must be one of chromium, firefox, or webkit",
    );
  }

  return options;
}

function getDefaultBrowserIdentifier() {
  if (process.platform === "win32") {
    const output = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice" /v ProgId',
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return output.match(/ProgId\s+REG_SZ\s+([^\r\n]+)/i)?.[1]?.trim() ?? null;
  }

  if (process.platform === "darwin") {
    return execSync(
      "osascript -e 'id of application (path to default web browser)'",
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  }

  if (process.platform === "linux") {
    return execSync("xdg-settings get default-web-browser", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  }

  return null;
}

function inferEngineFromBrowserPath(browserPath) {
  if (!browserPath) {
    return "chromium";
  }

  const name = path.basename(browserPath).toLowerCase();
  if (name.includes("firefox")) {
    return "firefox";
  }
  if (name.includes("safari") || name.includes("webkit")) {
    return "webkit";
  }
  return "chromium";
}

function detectBrowserConfig(options) {
  const candidates = BROWSER_MATRIX[process.platform] ?? [];
  let identifier = null;

  try {
    identifier = getDefaultBrowserIdentifier();
  } catch {
    identifier = null;
  }

  const matchingCandidate = candidates.find((candidate) =>
    candidate.ids.includes(identifier),
  );

  if (matchingCandidate) {
    if (matchingCandidate.engine === "webkit") {
      return {
        source: "default-browser",
        identifier,
        browser: {
          ...matchingCandidate,
          displayName: matchingCandidate.displayName ?? matchingCandidate.name,
          browserPath: null,
          userDataDir: null,
        },
      };
    }

    const executablePath = resolveBrowserExecutable(matchingCandidate);
    if (executablePath) {
      return {
        source: "default-browser",
        identifier,
        browser: {
          ...matchingCandidate,
          displayName: matchingCandidate.displayName ?? matchingCandidate.name,
          browserPath: executablePath,
          userDataDir: expandHome(matchingCandidate.userDataDir),
        },
      };
    }
  }

  if (options.browserPath) {
    return {
      source: "manual-path",
      identifier,
      browser: {
        name: "Custom Browser",
        displayName: "Custom Browser",
        engine:
          options.browserEngine ??
          inferEngineFromBrowserPath(options.browserPath),
        browserPath: expandHome(options.browserPath),
        userDataDir: options.userDataDir
          ? expandHome(options.userDataDir)
          : null,
        defaultProfile: options.profile,
      },
    };
  }

  for (const candidate of candidates) {
    if (candidate.engine === "webkit") {
      continue;
    }

    const executablePath = resolveBrowserExecutable(candidate);
    if (executablePath) {
      return {
        source: identifier ? "fallback-installed-browser" : "installed-browser",
        identifier,
        browser: {
          ...candidate,
          displayName: candidate.displayName ?? candidate.name,
          browserPath: executablePath,
          userDataDir: expandHome(candidate.userDataDir),
        },
      };
    }
  }

  return {
    source: "none",
    identifier,
    browser: null,
  };
}

function parseIniFile(filePath) {
  const sections = [];
  let currentSection = null;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = { name: sectionMatch[1] };
      sections.push(currentSection);
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1 || !currentSection) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    currentSection[key] = value;
  }

  return sections;
}

function resolveFirefoxProfilePath(rootDir, profileOption) {
  const expandedRoot = expandHome(rootDir);
  const profilesIniPath = path.join(expandedRoot, "profiles.ini");

  if (!fs.existsSync(profilesIniPath)) {
    throw new Error(
      `Firefox profiles.ini was not found at ${profilesIniPath}. Use --user-data-dir or --profile to point at a valid Firefox profile.`,
    );
  }

  const sections = parseIniFile(profilesIniPath).filter((section) =>
    /^Profile\d+$/i.test(section.name),
  );

  const toAbsolutePath = (section) => {
    if (!section?.Path) {
      return null;
    }

    return expandHome(
      section.IsRelative === "1"
        ? path.join(expandedRoot, section.Path)
        : section.Path,
    );
  };

  if (profileOption && profileOption !== "auto") {
    const explicitPath = expandHome(profileOption);
    if (path.isAbsolute(explicitPath) && fs.existsSync(explicitPath)) {
      return explicitPath;
    }

    const matchedSection = sections.find((section) => {
      const candidatePath = toAbsolutePath(section);
      return (
        section.Name === profileOption ||
        section.Path === profileOption ||
        path.basename(candidatePath || "") === profileOption
      );
    });

    if (!matchedSection) {
      throw new Error(
        `Firefox profile '${profileOption}' was not found in ${profilesIniPath}.`,
      );
    }

    return toAbsolutePath(matchedSection);
  }

  const defaultSection =
    sections.find((section) => section.Default === "1") ?? sections[0];
  const defaultPath = toAbsolutePath(defaultSection);

  if (!defaultPath || !fs.existsSync(defaultPath)) {
    throw new Error(
      `A usable Firefox profile could not be resolved from ${profilesIniPath}.`,
    );
  }

  return defaultPath;
}

function cloneDirectory(sourceDir, destinationDir) {
  const skippedPaths = [];
  const skippedDirectories = new Set([
    "Cache",
    "Code Cache",
    "GPUCache",
    "ShaderCache",
    "GrShaderCache",
    "DawnCache",
    "GraphiteDawnCache",
    "Crashpad",
    "BrowserMetrics",
    "Safe Browsing",
    "Safe Browsing Network",
    "Service Worker/CacheStorage",
    "Service Worker/Database",
    "optimization_guide_hint_cache_store",
  ]);

  const copyTree = (sourcePath, targetPath) => {
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      const normalizedSource = sourcePath.replace(/\\/g, "/");
      if (
        [...skippedDirectories].some(
          (segment) =>
            normalizedSource.endsWith(`/${segment}`) ||
            normalizedSource.includes(`/${segment}/`),
        )
      ) {
        return;
      }

      fs.mkdirSync(targetPath, { recursive: true });
      for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
        copyTree(
          path.join(sourcePath, entry.name),
          path.join(targetPath, entry.name),
        );
      }
      return;
    }

    try {
      fs.copyFileSync(sourcePath, targetPath);
    } catch (error) {
      if (["EBUSY", "EPERM", "EACCES"].includes(error.code)) {
        skippedPaths.push(sourcePath);
        return;
      }
      throw error;
    }
  };

  copyTree(sourceDir, destinationDir);
  return skippedPaths;
}

function prepareLaunchState(browserConfig, options) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "moodle-clicker-"));

  if (browserConfig.engine === "webkit") {
    const webkitDataDir = path.join(tempRoot, "webkit-session");
    fs.mkdirSync(webkitDataDir, { recursive: true });

    return {
      launchUserDataDir: webkitDataDir,
      tempRoot,
      resolvedProfile: "webkit-session",
      skippedPaths: [],
      launchArgs: [],
      copyApplied: false,
    };
  }

  if (!browserConfig.userDataDir) {
    throw new Error(
      "A browser profile directory could not be resolved automatically. Use --user-data-dir to point to the browser's user data directory.",
    );
  }

  if (browserConfig.engine === "firefox") {
    const profileDir = resolveFirefoxProfilePath(
      browserConfig.userDataDir,
      options.profile,
    );
    const profileName = path.basename(profileDir);

    if (!options.copyProfile) {
      return {
        launchUserDataDir: profileDir,
        tempRoot,
        resolvedProfile: profileName,
        skippedPaths: [],
        launchArgs: [],
        copyApplied: false,
      };
    }

    const clonedProfileDir = path.join(tempRoot, "firefox-profile");
    fs.mkdirSync(clonedProfileDir, { recursive: true });
    const skippedPaths = cloneDirectory(profileDir, clonedProfileDir);

    return {
      launchUserDataDir: clonedProfileDir,
      tempRoot,
      resolvedProfile: profileName,
      skippedPaths,
      launchArgs: [],
      copyApplied: true,
    };
  }

  const profileName =
    options.profile === "auto"
      ? (browserConfig.defaultProfile ?? "Default")
      : options.profile;
  const sourceProfileDir = path.join(browserConfig.userDataDir, profileName);

  if (!fs.existsSync(sourceProfileDir)) {
    throw new Error(`Profile directory not found: ${sourceProfileDir}`);
  }

  if (!options.copyProfile) {
    return {
      launchUserDataDir: browserConfig.userDataDir,
      tempRoot,
      resolvedProfile: profileName,
      skippedPaths: [],
      launchArgs: [`--profile-directory=${profileName}`, "--new-window"],
      copyApplied: false,
    };
  }

  const clonedUserDataDir = path.join(tempRoot, "User Data");
  const clonedProfileDir = path.join(clonedUserDataDir, profileName);
  fs.mkdirSync(clonedProfileDir, { recursive: true });

  const localStatePath = path.join(browserConfig.userDataDir, "Local State");
  if (fs.existsSync(localStatePath)) {
    fs.copyFileSync(
      localStatePath,
      path.join(clonedUserDataDir, "Local State"),
    );
  }

  const skippedPaths = cloneDirectory(sourceProfileDir, clonedProfileDir);

  return {
    launchUserDataDir: clonedUserDataDir,
    tempRoot,
    resolvedProfile: profileName,
    skippedPaths,
    launchArgs: [`--profile-directory=${profileName}`, "--new-window"],
    copyApplied: true,
  };
}

async function waitForCoursePage(page, target, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (page.url().startsWith(target)) {
      return true;
    }

    console.log(
      `Waiting for login or navigation to target page. Current URL: ${page.url()}`,
    );
    await sleep(3000);
  }

  return false;
}

async function collectTodoLinks(page) {
  return page.locator("a.aalink").evaluateAll((links) => {
    const todoCandidates = links
      .map((link) => {
        const text = (link.textContent || "").replace(/\s+/g, " ").trim();
        const href = link.href;
        const primaryContainer =
          link.closest(
            '[data-for="cmitem"], li.activity, .activity-item, .activity, li[id^="module-"], [id^="module-"]',
          ) || link.parentElement;
        const secondaryContainer =
          primaryContainer?.parentElement?.closest(
            'li.activity, .activity-item, .activity, li[id^="module-"], [id^="module-"]',
          ) || primaryContainer?.parentElement;
        const statusText =
          `${primaryContainer?.innerText || ""} ${secondaryContainer?.innerText || ""}`
            .replace(/\s+/g, " ")
            .trim();

        return { text, href, statusText };
      })
      .filter(
        ({ text, href, statusText }) =>
          /\bto do\b/i.test(statusText) &&
          !/\bdone\b/i.test(text) &&
          href &&
          !/^\s*(previous|next)\s*$/i.test(text),
      );

    const numberedCandidates = todoCandidates.filter(({ text }) =>
      /^\d/.test(text),
    );
    return numberedCandidates.length ? numberedCandidates : todoCandidates;
  });
}

function normalizeComparableUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl;
  }
}

async function getNextSectionHref(page, currentUrl) {
  const selectors = [
    ".nextsection a",
    "a[rel='next']",
    ".section-navigation a[title*='next' i]",
    ".section-navigation a[aria-label*='next' i]",
    ".section-navigation .next a",
    ".course-section-nav a[title*='next' i]",
    ".course-navigation a[title*='next' i]",
  ];

  for (const selector of selectors) {
    const link = page.locator(selector).first();
    if ((await link.count()) > 0) {
      const href = await link.getAttribute("href");
      if (
        href &&
        normalizeComparableUrl(href) !== normalizeComparableUrl(currentUrl)
      ) {
        return href;
      }
    }
  }

  return page
    .evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      const nextAnchor = anchors.find((anchor) => {
        const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
        const title = [
          anchor.getAttribute("title") || "",
          anchor.getAttribute("aria-label") || "",
          anchor.getAttribute("rel") || "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          /next/i.test(text) ||
          /next/.test(title) ||
          /(next section|next topic|go to next)/i.test(text)
        );
      });

      return nextAnchor?.href || null;
    })
    .then((href) =>
      href &&
      normalizeComparableUrl(href) !== normalizeComparableUrl(currentUrl)
        ? href
        : null,
    );
}

async function isTerminalCoursePage(page) {
  return page.evaluate(() => {
    const text = (document.body?.innerText || "")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const title = (document.title || "").toLowerCase();
    const headingText = Array.from(
      document.querySelectorAll("h1, h2, .page-header-headings, .page-title"),
    )
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const hasNextSectionLink = Boolean(
      document.querySelector(
        ".nextsection a, a[rel='next'], .section-navigation a[title*='next' i], .section-navigation .next a",
      ),
    );
    const isCourseOverviewUrl = /\/course\/view\.php\?id=\d+/i.test(
      window.location.href,
    );
    const looksLikeFeedbackPage =
      text.includes("feedback about the course") ||
      text.includes("feedback for course") ||
      title.includes("feedback") ||
      headingText.includes("feedback");

    return looksLikeFeedbackPage && !hasNextSectionLink && !isCourseOverviewUrl;
  });
}

async function openInShortLivedTab(context, href, visitMs) {
  const tab = await context.newPage();

  try {
    await tab.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (visitMs > 0) {
      await sleep(visitMs);
    }
  } catch (error) {
    console.log(`Visit failed for ${href}: ${error.message}`);
  } finally {
    await tab.close().catch(() => {});
  }
}

async function processBatch(context, links, visitMs, concurrency) {
  for (let index = 0; index < links.length; index += concurrency) {
    const batch = links.slice(index, index + concurrency);
    console.log(
      `Opening batch ${Math.floor(index / concurrency) + 1}: ${batch.length} link(s)`,
    );
    await Promise.all(
      batch.map((link) => openInShortLivedTab(context, link.href, visitMs)),
    );
  }
}

async function processSection(page, context, sectionUrl, options) {
  let totalOpened = 0;

  for (let pass = 1; ; pass += 1) {
    await page.bringToFront();
    await page.goto(sectionUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await sleep(options.scanDelayMs);

    if (await isTerminalCoursePage(page)) {
      return {
        totalOpened,
        nextSectionHref: null,
        reachedTerminalPage: true,
      };
    }

    const links = await collectTodoLinks(page);
    console.log(
      `Pass ${pass}: found ${links.length} matching link(s) on ${sectionUrl}`,
    );

    if (!links.length) {
      return {
        totalOpened,
        nextSectionHref: await getNextSectionHref(page, sectionUrl),
        reachedTerminalPage: false,
      };
    }

    links.forEach((link) => {
      console.log(`  ${link.text} -> ${link.href}`);
    });

    await processBatch(context, links, options.visitMs, options.concurrency);
    totalOpened += links.length;
  }
}

async function processCourse(context, target, options) {
  const existingPages = context.pages().filter((page) => !page.isClosed());
  const page = existingPages[0] ?? (await context.newPage());

  await Promise.all(
    existingPages
      .slice(1)
      .map((extraPage) => extraPage.close().catch(() => {})),
  );

  await page.goto(target, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const ready = await waitForCoursePage(page, target, options.loginTimeoutMs);
  if (!ready) {
    throw new Error(
      "Timed out waiting for the target course page. Log in manually in the opened browser window, then rerun the script.",
    );
  }

  let totalOpened = 0;
  let currentSectionUrl = target;
  let sectionIndex = 1;
  const visitedSectionUrls = new Set();

  while (currentSectionUrl) {
    if (visitedSectionUrls.has(currentSectionUrl)) {
      console.log(
        `Detected a navigation loop at ${currentSectionUrl}. Stopping traversal.`,
      );
      break;
    }

    visitedSectionUrls.add(currentSectionUrl);
    console.log(`Section ${sectionIndex}: ${currentSectionUrl}`);
    const result = await processSection(
      page,
      context,
      currentSectionUrl,
      options,
    );

    totalOpened += result.totalOpened;

    if (result.reachedTerminalPage) {
      console.log("Reached the course feedback page. Stopping traversal.");
      break;
    }

    if (!result.totalOpened) {
      if (!result.nextSectionHref) {
        console.log(
          "Current section has no matching To do links and no next section link. Stopping traversal.",
        );
        break;
      }

      console.log(
        "Current section has no matching To do links. Moving to the next section.",
      );
    }

    if (!result.nextSectionHref) {
      console.log(
        "No next section link was detected on this page. Stopping traversal.",
      );
      break;
    }

    console.log(`Moving to next section: ${result.nextSectionHref}`);
    currentSectionUrl = result.nextSectionHref;
    sectionIndex += 1;
  }

  await page.goto("about:blank").catch(() => {});
  return totalOpened;
}

async function promptForCourseUrl(rl, suggestedUrl) {
  while (true) {
    const answer = (
      await rl.question(`Enter a Moodle course section URL [${suggestedUrl}]: `)
    ).trim();
    const rawValue = answer || suggestedUrl;

    try {
      const parsed = new URL(rawValue);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Unsupported protocol");
      }

      return parsed.toString();
    } catch {
      console.log("Please enter a full http(s) URL.");
    }
  }
}

async function promptYesNo(rl, question) {
  while (true) {
    const answer = (await rl.question(question)).trim().toLowerCase();
    if (["y", "yes"].includes(answer)) {
      return true;
    }
    if (["n", "no", ""].includes(answer)) {
      return false;
    }
    console.log("Please answer yes or no.");
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const detected = detectBrowserConfig(options);

  if (!detected.browser) {
    const identifierText = detected.identifier
      ? `Detected default browser id: ${detected.identifier}. `
      : "";
    throw new Error(
      `${identifierText}No supported browser could be resolved automatically. Use --browser-path, --browser-engine, and optionally --user-data-dir to point at a Chromium or Firefox browser.`,
    );
  }

  if (!options.browserEngine) {
    options.browserEngine = detected.browser.engine;
  }

  if (!options.browserPath) {
    options.browserPath = detected.browser.browserPath;
  }

  if (!options.userDataDir) {
    options.userDataDir = detected.browser.userDataDir;
  }

  options.userDataDir = expandHome(options.userDataDir);

  printBanner();
  console.log(`OS: ${process.platform}`);
  console.log(
    `Browser: ${detected.browser.displayName}${detected.identifier ? ` (${detected.identifier})` : ""}`,
  );
  console.log(`Engine: ${options.browserEngine}`);
  if (options.browserPath) {
    console.log(`Browser path: ${options.browserPath}`);
  } else {
    console.log("Browser path: managed by Playwright");
  }
  if (options.userDataDir) {
    console.log(`User data dir: ${options.userDataDir}`);
  } else {
    console.log("User data dir: ephemeral session");
  }
  if (detected.browser.caveat) {
    console.log(`Note: ${detected.browser.caveat}`);
  }
  console.log("");

  const rl = readline.createInterface({ input, output });

  let target = options.target;
  try {
    target = await promptForCourseUrl(rl, options.target);

    const browserType = BROWSER_TYPES[options.browserEngine];
    if (!browserType) {
      throw new Error(`Unsupported browser engine: ${options.browserEngine}`);
    }

    while (true) {
      let context;
      let launchState;

      launchState = prepareLaunchState(detected.browser, options);

      if (launchState.copyApplied) {
        console.log("");
        console.log(
          `Using temporary cloned profile: ${launchState.launchUserDataDir}`,
        );
        if (launchState.skippedPaths.length) {
          console.log(
            "Some profile files were locked and could not be copied.",
          );
          launchState.skippedPaths.slice(0, 5).forEach((filePath) => {
            console.log(`  skipped: ${filePath}`);
          });
          if (launchState.skippedPaths.length > 5) {
            console.log(`  ...and ${launchState.skippedPaths.length - 5} more`);
          }
          console.log(
            "If the copied session looks incomplete, close the source browser completely and rerun the script.",
          );
        }
      }

      console.log("");
      console.log(`Opening browser for: ${target}`);

      try {
        context = await browserType.launchPersistentContext(
          launchState.launchUserDataDir,
          {
            executablePath: options.browserPath || undefined,
            headless: options.headless,
            args: launchState.launchArgs,
            viewport: { width: 1400, height: 1000 },
          },
        );

        console.log("");
        console.log(`Starting course: ${target}`);
        const openedCount = await processCourse(context, target, options);
        console.log("");
        console.log(`Done. Opened ${openedCount} link(s) total.`);
        console.log("");
      } finally {
        await context?.close().catch(() => {});
        if (launchState?.tempRoot) {
          fs.rmSync(launchState.tempRoot, { recursive: true, force: true });
        }
      }

      const shouldContinue = await promptYesNo(
        rl,
        "Process another Moodle course? (yes/no) [no]: ",
      );

      if (!shouldContinue) {
        break;
      }

      target = await promptForCourseUrl(rl, target);
    }
  } finally {
    rl.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
