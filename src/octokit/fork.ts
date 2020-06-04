import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

// Compare: https://developer.github.com/v3/repos/#list-organization-repositories


export default async function fork () {
    octokit.pulls.list({
        owner: "kristietom@google.com",
        repo: "ssh://kristietom@google.com@source.developers.google.com:2022/p/kristie-tom-test/r/GitHub-OpenSource-Auto-PR"
    })
}
