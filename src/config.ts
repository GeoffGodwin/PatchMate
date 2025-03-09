import * as fs from "fs";
import yaml from "js-yaml";

export enum Aggressiveness {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

export const getConfig = () => {
    try {
        const config = yaml.load(fs.readFileSync(".patchmate.yml", "utf8")) as Record<string, any>;
        return {
            update_schedule: config.update_schedule || "weekly",
            auto_merge_minor: config.auto_merge_minor || false,
            notify_major_changes: config.notify_major_changes || true,
            ai_mode: (config.ai_mode as Aggressiveness) || Aggressiveness.MEDIUM
        };
    } catch (error) {
        console.error("⚠️ Failed to load .patchmate.yml");
        process.exit(1);
    }
};
