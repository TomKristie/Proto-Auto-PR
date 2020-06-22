import { Changes } from "../get-changes";
import { Application } from "../application";
import { Files } from "../types";
import { REPLServer } from "repl";
const mainBranch = "master";

class ForkAndBranch {
    private readonly app: Application;
    private readonly ownerOriginal: string;
    private readonly repoName: string;

    constructor(app: Application, owner: string, repoName: string) {
        this.app = app;
        this.ownerOriginal = owner;
        this.repoName = repoName;
    }
    

    private async fork() {
        const forkedRepo = (await this.app.octokit.repos.createFork({
            owner: this.ownerOriginal,
            repo: this.repoName
        })).data;
        this.app.log.debug("Fork was either successful, or fork peacefully already exists");
        return {
            newRepo: forkedRepo.name,
            newOwner: forkedRepo.owner.login,
            repoPushedAt: new Date(forkedRepo.pushed_at)
        };
    }

    private async branch(owner: string, repo: string) {
        try {
            const mainBranchHeadSHA = (await this.app.octokit.repos.listBranches({
                owner,
                repo
            })).data.find(branch => branch.name == mainBranch)?.commit.sha;
            if (mainBranchHeadSHA) {
                //const branchName = `third-party-${Date.now()}`;
                const branchName = "third-party";
                const newBranch = (await this.app.octokit.git.createRef({
                    owner,
                    repo,
                    ref: `refs/heads/${branchName}`,
                    sha: mainBranchHeadSHA
                })).data;
                this.app.log.info("branch created with head at: ",mainBranchHeadSHA);
                this.app.log.debug("branch data:\n", newBranch);
                return { branchSHA: mainBranchHeadSHA, branchUrl: newBranch.url, branchName }
            }
            return { branchSHA: mainBranchHeadSHA, branchUrl: undefined }
        } catch (err) {
            this.app.log.error(`Error in creating branch ${err}`);
            return {};
        }
    }
    public async run() {
        const { newRepo , newOwner } = await this.fork();
        if (!(newRepo && newOwner)) {
            return {};
        }
        const { branchSHA, branchUrl, branchName } = await this.branch(newOwner, newRepo);
        if (!(branchSHA && branchUrl && branchName)) {
            return {};
        }
        
        return { branchName, branchSHA, owner: newOwner, repoName: newRepo };
    }
}

declare type GitCreateTreeParamsTree = {
    path?: string;
    mode?: "100644" | "100755" | "040000" | "160000" | "120000";
    type?: "blob" | "tree" | "commit";
    sha?: string | null;
    content?: string;
};

class PushAndPR {
    
    private readonly app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Create a github tree and return its SHA
     * @param changes 
     * @param owner 
     * @param repoName 
     */
    private async createTree(changes: Files, owner: string, repoName: string): Promise<string> {
        const tree: GitCreateTreeParamsTree[] = [];
        for (const path in changes) {
            tree.push({
                path,
                mode: "100644",
                type: "blob",
                content: changes[path]
            });
        }
        const treeSHA = (await this.app.octokit.git.createTree({
            owner: owner,
            repo: repoName,
            tree: tree
        })).data.sha;
        return treeSHA;
    }

    private async commitToBranch(branchSHA: string, treeSHA: string, owner: string, repoName: string) {
        this.app.octokit.git.createCommit({
            owner: owner,
            repo: repoName,
            message: "Third-Party Changes",
            tree: treeSHA,
            parents: [ branchSHA ]
        });
    }


    private async updateBranchReference() {

    }
    
    private async makePR(
        forkPushedAt: Date
    ) {
        const currentTime = new Date();
        const isForkOutOfDate = currentTime >= forkPushedAt;
        if (isForkOutOfDate) {
            this.app.log.debug("Fork is out of synch");
            // TODO - autosync fork, update branch, and re-apply changes
        }
    }

    private async autoSync() {
        //
    }
    
    public async run(changes: Files, owner: string, repoName: string, branchSHA: string) {
        const treeSHA = await this.createTree(changes, owner, repoName);
        if (!treeSHA) return;
        await this.commitToBranch(branchSHA, treeSHA, owner, repoName);
        await this.updateBranchReference();
    }

}

async function runGitHub(app: Application) {
    app.log.debug("Starting github workflow")
    // TODO configure this
    // =============================================================
    const ownerOriginal = "Kristie-Tom-Test";
    const repoOriginal = "HelloWorld";
    // =============================================================
    // make changes
    const changeHandler = new Changes(app, ownerOriginal, repoOriginal)
    const changes = await changeHandler.get();
    // fork and branch
    const { branchName, branchSHA, owner, repoName } = await (new ForkAndBranch(app, ownerOriginal, repoOriginal)).run();
    if (!(branchName && owner && repoName && branchSHA)) return;
    // create PR
    const pushPRHandler = new PushAndPR(app);
    await pushPRHandler.run(changes, owner, repoName, branchSHA);
}

export { runGitHub }