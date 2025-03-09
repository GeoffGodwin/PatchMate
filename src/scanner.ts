import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export const scanDependencies = (): Record<string, any> => {
    console.log("📦 Checking for outdated dependencies...");
    let outdatedDeps: Record<string, any> = {};

    try {
        const output = execSync("npm outdated --json", { encoding: "utf-8" });
        outdatedDeps = JSON.parse(output);
    } catch (error: any) {
        if (error.stdout) {
            try {
                outdatedDeps = JSON.parse(error.stdout);
            } catch (jsonError) {
                console.error("⚠️ Failed to parse npm outdated output.");
            }
        } else {
            console.log("✅ All dependencies are up to date!");
            process.exit(0);
        }
    }

    // Save outdated dependencies to a log file
    const outputPath = path.join(__dirname, "../outdated-dependencies.json");
    fs.writeFileSync(outputPath, JSON.stringify(outdatedDeps, null, 2));
    console.log(`📄 Outdated dependency report saved to: ${outputPath}`);

    return outdatedDeps;
};
