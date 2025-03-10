import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";

// Ensure the outdated dependencies file is saved in the user's project directory.
const outputPath = path.join(process.cwd(), "outdated-dependencies.json");

export const scanDependencies = (): Record<string, any> => {
    console.log("📦 Checking for outdated dependencies...");

    let outdatedDeps: Record<string, any> = {};
    try {
        // Run `npm outdated --json` and parse the result
        const output = execSync("npm outdated --json", { encoding: "utf-8" }).trim();

        // If `npm outdated` returns an empty string, all dependencies are up to date
        if (!output) {
            console.log("✅ All dependencies are up to date!");
            return {};
        }

        outdatedDeps = JSON.parse(output);

    } catch (error: any) {
        // `npm outdated` throws an error if no outdated dependencies are found
        if (error.stdout) {
            try {
                const parsedOutput = JSON.parse(error.stdout.trim());
                if (Object.keys(parsedOutput).length === 0) {
                    console.log("✅ No outdated dependencies detected.");
                    return {};
                }
                outdatedDeps = parsedOutput;
            } catch (jsonError) {
                console.error("⚠️ Failed to parse npm outdated output.");
                return {};
            }
        } else {
            console.error("⚠️ Error running `npm outdated`. Check if NPM is installed correctly.");
            return {};
        }
    }

    // Generate a detailed report
    const report = Object.entries(outdatedDeps).map(([pkg, details]) => ({
        package: pkg,
        current: (details as any).current,
        latest: (details as any).latest,
        wanted: (details as any).wanted,
        type: (details as any).type || "dependency"
    }));

    if (report.length === 0) {
        console.log("✅ No outdated dependencies found.");
        return {};
    }

    // Write the detailed outdated dependencies report
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Outdated dependencies detected! Report saved to: ${outputPath}`);

    // Display a summary in the console
    console.table(report);

    return report;
};