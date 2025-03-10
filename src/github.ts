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

export const createGitHubPR = async (packageName: string, oldVersion: string, newVersion: string) => {
    console.log(`📦 Creating PR to update ${packageName}...`);

    const owner = config.github_user;
    const repo = config.github_repo;
    const base = config.target_branch;
    const branchName = `patchmate/update-${packageName}-${newVersion}`;

    try {
        // Ensure the base branch exists before creating a new branch
        const baseBranch = await octokit.repos.getBranch({ owner, repo, branch: base });

        // Create a new branch from the latest commit of the base branch
        await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: baseBranch.data.commit.sha
        });

        // Create the Pull Request
        await octokit.pulls.create({
            owner,
            repo,
            title: `⬆️ PatchMate: Update ${packageName} to ${newVersion}`,
            body: `This is an automated PR by **PatchMate**. Updating **${packageName}** from **${oldVersion}** to **${newVersion}**.\n\nNo breaking changes detected.`,
            head: branchName,
            base
        });

        console.log(`✅ PR created for ${packageName}`);
    } catch (error: any) {
        console.error(`⚠️ Failed to create PR for ${packageName}: ${error.message}`);
    }
};
