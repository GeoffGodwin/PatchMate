import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export const createGitHubIssue = async (packageName: string, analysis: string) => {
    console.log(`🚀 Creating GitHub Issue for ${packageName}...`);

    const issueTitle = `🚨 Major Update: ${packageName} requires migration`;
    const issueBody = `## AI-Generated Analysis\n${analysis}\n\n### Suggested Next Steps\n- Review breaking changes.\n- Decide whether to migrate or find alternatives.\n\n🔗 **PatchMate automatically detected this update!**`;

    await octokit.issues.create({
        owner: "your-github-user",
        repo: "PatchMate",
        title: issueTitle,
        body: issueBody
    });

    console.log(`✅ GitHub Issue created for ${packageName}`);
};

export const createGitHubPR = async (packageName: string, oldVersion: string, newVersion: string) => {
    console.log(`📦 Creating PR to update ${packageName}...`);

    const branchName = `patchmate/update-${packageName}-${newVersion}`;
    await octokit.git.createRef({
        owner: "your-github-user",
        repo: "PatchMate",
        ref: `refs/heads/${branchName}`,
        sha: (await octokit.repos.getBranch({ owner: "your-github-user", repo: "PatchMate", branch: "main" })).data.commit.sha
    });

    await octokit.pulls.create({
        owner: "your-github-user",
        repo: "PatchMate",
        title: `⬆️ PatchMate: Update ${packageName} to ${newVersion}`,
        body: `This is an automated PR by **PatchMate**. Updating **${packageName}** from **${oldVersion}** to **${newVersion}**.\n\nNo breaking changes detected.`,
        head: branchName,
        base: "main"
    });

    console.log(`✅ PR created for ${packageName}`);
};
