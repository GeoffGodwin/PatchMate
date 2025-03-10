import * as fs from "fs";
import * as yaml from "js-yaml";
import path from "path";

// Ensure we read the config from the project's root directory
const CONFIG_PATH = path.join(process.cwd(), ".patchmate.yml");

export enum Aggressiveness {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

export const getConfig = () => {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.log("⚠️ .patchmate.yml not found. Generating a default config...");

        const defaultConfig = {
            ai_provider: "AWS",
            ai_mode: Aggressiveness.MEDIUM,
            update_schedule: "weekly"
        };

        fs.writeFileSync(CONFIG_PATH, yaml.dump(defaultConfig));
        console.log("✅ Default .patchmate.yml created at", CONFIG_PATH);
    }

    try {
        const config = yaml.load(fs.readFileSync(CONFIG_PATH, "utf8")) as Record<string, any>;
        return {
            ai_provider: config.ai_provider || "AWS",
            ai_mode: (config.ai_mode as Aggressiveness) || Aggressiveness.MEDIUM,
            update_schedule: config.update_schedule || "weekly"
        };
    } catch (error) {
        console.error("⚠️ Failed to load .patchmate.yml, using default config.");
        return { ai_provider: "AWS", ai_mode: Aggressiveness.MEDIUM, update_schedule: "weekly" };
    }
};
