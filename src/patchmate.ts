#!/usr/bin/env node
import { scanDependencies } from "./scanner.js";
import { analyzeChangelog } from "./ai.js";
import { createGitHubIssue, createGitHubPR } from "./github.js";
import { getConfig, Aggressiveness } from "./config.js";
import * as fs from "fs";
import { execSync } from "child_process";

console.log("🔍 Running PatchMate Dependency Check...");

// Load configuration settings
const CONFIG = getConfig();
console.log(`🛠 AI Aggressiveness Level: ${CONFIG.ai_mode}`);

const outdatedDeps = scanDependencies();

// Process each outdated dependency
for (const index in outdatedDeps) {
    const newVersion = outdatedDeps[index].latest;
    const oldVersion = outdatedDeps[index].current;
    const packageName = outdatedDeps[index].package;

    analyzeChangelog(packageName, newVersion).then((analysis) => {
        if (CONFIG.ai_mode === Aggressiveness.LOW) {
            console.log(`⚠️ ${index}: Needs update from ${oldVersion} → ${newVersion}.`);
        } else if (analysis.includes("breaking change")) {
            createGitHubIssue(packageName, analysis);
        } else {
            console.log(`📦 Updating ${packageName} from ${oldVersion} to ${newVersion}...`);

            // ✅ Step 1: Read and update package.json
            const packageJsonPath = "./package.json";
            const packageLockPath = "./package-lock.json";

            if (!fs.existsSync(packageJsonPath) || !fs.existsSync(packageLockPath)) {
                console.error(`⚠️ Missing package.json or package-lock.json. Skipping ${packageName}`);
                return;
            }

            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

            if (packageJson.dependencies?.[packageName]) {
                packageJson.dependencies[packageName] = newVersion;
            } else if (packageJson.devDependencies?.[packageName]) {
                packageJson.devDependencies[packageName] = newVersion;
            } else {
                console.warn(`⚠️ ${packageName} not found in package.json. Skipping...`);
                return;
            }

            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");

            // ✅ Step 2: Run `npm install` to update package-lock.json
            console.log(`📦 Running npm install to update package-lock.json...`);
            try {
                execSync("npm install", { stdio: "inherit" });
            } catch (error) {
                console.error(`❌ Failed to run npm install for ${packageName}. Skipping PR creation.`);
                return;
            }

            // ✅ Step 3: Read updated files to pass to GitHub PR
            const updatedFiles = {
                "package.json": fs.readFileSync(packageJsonPath, "utf8"),
                "package-lock.json": fs.readFileSync(packageLockPath, "utf8")
            };

            // ✅ Step 4: Create a GitHub PR with the updated files
            createGitHubPR(packageName, oldVersion, newVersion, updatedFiles);
        }
    });
}
