import * as fs from "fs";
import * as yaml from "js-yaml";
import path from "path";

export enum Aggressiveness {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

// Ensure we read the config from the user's project root directory
const CONFIG_PATH = path.join(process.cwd(), ".patchmate.yml");

export interface PatchMateConfig {
    ai_provider: string;
    ai_mode: Aggressiveness;
    update_schedule: string;
    github_user: string;
    github_repo: string;
    target_branch: string;
}

export const getConfig = (): PatchMateConfig => {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.log("⚠️ .patchmate.yml not found. Generating a default config...");

        const defaultConfig: PatchMateConfig = {
            ai_provider: "AWS",
            ai_mode: Aggressiveness.MEDIUM,
            update_schedule: "weekly",
            github_user: "your-github-user", // Default placeholder
            github_repo: "your-repository", // Default placeholder
            target_branch: "main" // Default branch
        };

        fs.writeFileSync(CONFIG_PATH, yaml.dump(defaultConfig));
        console.log("✅ Default .patchmate.yml created at", CONFIG_PATH);
    }

    try {
        const config = yaml.load(fs.readFileSync(CONFIG_PATH, "utf8")) as PatchMateConfig;
        return {
            ai_provider: config.ai_provider || "AWS",
            ai_mode: config.ai_mode || Aggressiveness.MEDIUM,
            update_schedule: config.update_schedule || "weekly",
            github_user: config.github_user || "your-github-user",
            github_repo: config.github_repo || "your-repository",
            target_branch: config.target_branch || "main"
        };
    } catch (error) {
        console.error("⚠️ Failed to load .patchmate.yml, using default config.");
        return {
            ai_provider: "AWS",
            ai_mode: Aggressiveness.MEDIUM,
            update_schedule: "weekly",
            github_user: "your-github-user",
            github_repo: "your-repository",
            target_branch: "main"
        };
    }
};
