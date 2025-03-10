import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import * as fs from "fs";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const DAILY_LIMIT = 100; // Max AI calls per day
const USAGE_TRACKER = "./ai-usage.json"; // Track requests

const getUsage = () => {
    if (fs.existsSync(USAGE_TRACKER)) {
        const data = JSON.parse(fs.readFileSync(USAGE_TRACKER, "utf8"));
        if (data.date === new Date().toISOString().slice(0, 10)) {
            return data.count;
        }
    }
    return 0;
};

const updateUsage = () => {
    fs.writeFileSync(USAGE_TRACKER, JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: getUsage() + 1 }));
};

export const analyzeChangelog = async (packageName: string, newVersion: string): Promise<string> => {
    if (getUsage() >= DAILY_LIMIT) {
        console.log(`🚨 AI request limit reached (${DAILY_LIMIT} requests/day). Skipping analysis.`);
        return "AI request limit reached.";
    }

    console.log(`🤖 AI analyzing changelog for ${packageName}@${newVersion}...`);

    const promptText = `Analyze the changelog for ${packageName} version ${newVersion}. 
    Summarize breaking changes and provide migration suggestions.`;
    
    // AWS Bedrock expects `inputText` instead of just `prompt`
    const requestBody = {
        inputText: promptText,
        textGenerationConfig: {
            maxTokenCount: 250,
            stopSequences: [],
            temperature: 0.5,
            topP: 0.9
        }
    };

    const command = new InvokeModelCommand({
        modelId: "amazon.titan-text-lite-v1",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody)
    });

    try {
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(Buffer.from(response.body as Uint8Array).toString("utf8"));

        const output = responseBody.results?.[0]?.outputText || "No analysis available.";
        console.log(`📝 AI Analysis for ${packageName}@${newVersion}:\n${output}`);
        
        updateUsage();
        return output;
    } catch (error) {
        console.error(`⚠️ AI analysis failed for ${packageName}:`, error);
        return "AI analysis unavailable.";
    }
};
