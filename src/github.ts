import { Octokit } from "@octokit/rest";
import { getConfig } from "./config.js";

const config = getConfig();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export const createGitHubIssue = async (packageName: string, analysis: string) => {
    const owner = config.github_user;
    const repo = config.github_repo;

    console.log(`🚀 Creating GitHub Issue for ${packageName}...`);

    const issueTitle = `🚨 Major Update: ${packageName} requires migration`;
    const issueBody = `## AI-Generated Analysis\n${analysis}\n\n### Suggested Next Steps\n- Review breaking changes.\n- Decide whether to migrate or find alternatives.\n\n🔗 **PatchMate automatically detected this update!**`;

    await octokit.issues.create({
        owner,
        repo,
        title: issueTitle,
        body: issueBody
    });

    console.log(`✅ GitHub Issue created for ${packageName}`);
};

export const createGitHubPR = async (packageName: string, oldVersion: string, newVersion: string, updatedFiles: { [filename: string]: string }) => {
    console.log(`📦 Creating PR to update ${packageName}...`);

    const owner = config.github_user;
    const repo = config.github_repo;
    const base = config.target_branch;
    let branchName = `patchmate/update-${packageName}-${newVersion}`;

    try {
        // Step 1: Check if branch already exists
        const existingBranches = await octokit.repos.listBranches({ owner, repo });
        const branchExists = existingBranches.data.some(branch => branch.name === branchName);

        if (branchExists) {
            console.warn(`⚠️ Branch '${branchName}' already exists. Creating an alternate branch.`);
            branchName = `patchmate/update-${packageName}-${newVersion}-${Date.now()}`;
        }

        // Step 2: Get SHA of base branch (main)
        const baseBranch = await octokit.repos.getBranch({ owner, repo, branch: base });

        // Step 3: Create a new branch from base branch
        await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: baseBranch.data.commit.sha
        });

        console.log(`🔄 Checking for file changes before committing...`);
        if (Object.keys(updatedFiles).length === 0) {
            console.warn(`⚠️ No changes detected for ${packageName}. Skipping PR creation.`);
            return;
        }

        // Step 4: Commit the updated files
        for (const [filePath, fileContent] of Object.entries(updatedFiles)) {
            const fileSha = await getExistingFileSha(owner, repo, filePath);
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: filePath,
                message: `⬆️ PatchMate: Update ${packageName} to ${newVersion}`,
                content: Buffer.from(fileContent).toString("base64"),
                branch: branchName,
                sha: fileSha
            });
        }

        // Step 5: Create the Pull Request
        await octokit.pulls.create({
            owner,
            repo,
            title: `⬆️ PatchMate: Update ${packageName} to ${newVersion}`,
            body: `This is an automated PR by **PatchMate**. Updating **${packageName}** from **${oldVersion}** to **${newVersion}**.\n\nNo breaking changes detected.`,
            head: branchName,
            base
        });

        console.log(`✅ PR created for ${packageName} in branch ${branchName}`);
    } catch (error: any) {
        console.error(`⚠️ Failed to create PR for ${packageName}: ${error.message}`);
    }
};

// Helper function to get SHA of an existing file in the repo
const getExistingFileSha = async (owner: string, repo: string, filePath: string): Promise<string | undefined> => {
    try {
        const response = await octokit.repos.getContent({ owner, repo, path: filePath });
        return (response.data as any).sha;
    } catch (error) {
        console.warn(`⚠️ File '${filePath}' not found in repo.`);
        return undefined;
    }
};
