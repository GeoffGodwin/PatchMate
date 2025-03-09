import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const analyzeChangelog = async (packageName: string, newVersion: string): Promise<string> => {
    console.log(`🤖 AI analyzing changelog for ${packageName}@${newVersion}...`);
    const prompt = `Analyze the changelog for ${packageName} version ${newVersion} and summarize breaking changes.`;

    const command = new InvokeModelCommand({
        modelId: "amazon.titan-text-lite-v1",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ prompt, maxTokens: 200 })
    });

    const response = await bedrockClient.send(command);
    return response.body?.toString() || "No analysis available.";
};
