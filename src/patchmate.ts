#!/usr/bin/env node
import { scanDependencies } from "./scanner.js";
import { analyzeChangelog } from "./ai.js";
import { createGitHubIssue, createGitHubPR } from "./github.js";
import { getConfig, Aggressiveness } from "./config.js";

console.log("🔍 Running PatchMate Dependency Check...");

// Load configuration settings
const CONFIG = getConfig();
console.log(`🛠 AI Aggressiveness Level: ${CONFIG.ai_mode}`);

const outdatedDeps = scanDependencies();

// Process each outdated dependency
for (const packageName in outdatedDeps) {
    const newVersion = outdatedDeps[packageName].latest;
    const oldVersion = outdatedDeps[packageName].current;

    analyzeChangelog(packageName, newVersion).then((analysis) => {
        if (CONFIG.ai_mode === Aggressiveness.LOW) {
            console.log(`⚠️ ${packageName}: Needs update from ${oldVersion} → ${newVersion}.`);
        } else if (analysis.includes("breaking change")) {
            createGitHubIssue(packageName, analysis);
        } else {
            createGitHubPR(packageName, oldVersion, newVersion);
        }
    });
}
