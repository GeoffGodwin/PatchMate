import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const analyzeChangelog = async (packageName: string, newVersion: string): Promise<string> => {
    console.log(`🤖 AI analyzing changelog for ${packageName}@${newVersion}...`);

    const prompt = `Analyze the changelog for ${packageName} version ${newVersion}. Summarize breaking changes and provide migration suggestions.`;

    const command = new InvokeModelCommand({
        modelId: "amazon.titan-text-lite-v1",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ prompt, maxTokens: 250 })
    });

    try {
        const response = await bedrockClient.send(command);
        const output = response.body?.toString() || "No analysis available.";
        console.log(`📝 AI Analysis for ${packageName}@${newVersion}:\n${output}`);
        return output;
    } catch (error) {
        console.error(`⚠️ AI analysis failed for ${packageName}:`, error);
        return "AI analysis unavailable.";
    }
};
