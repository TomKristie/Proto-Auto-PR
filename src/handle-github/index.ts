import { Changes } from "../get-changes";
import { Application } from "../application";
import { Files } from "../types";
import { REPLServer } from "repl";
import { resolve } from "dns";
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

    private async branch(owner: string, repo: string, ref: string) {
        let mainBranchHeadSHA: string | undefined;
        try {
            mainBranchHeadSHA = (await this.app.octokit.repos.listBranches({
                owner,
                repo
            })).data.find(branch => branch.name == mainBranch)?.commit.sha;
            this.app.log.debug(`Main branch SHA: ${mainBranchHeadSHA}`);
            if (mainBranchHeadSHA) {
                const newBranch = (await this.app.octokit.git.createRef({
                    owner,
                    repo,
                    ref,
                    sha: mainBranchHeadSHA
                })).data;
                this.app.log.info("branch created with head at: ",mainBranchHeadSHA);
                this.app.log.debug("branch data:\n", newBranch);
                return { branchSHA: mainBranchHeadSHA, branchName: this.app.branchName }
            }
            return { branchSHA: mainBranchHeadSHA, branchName: this.app.branchName }
        } catch (err) {
            this.app.log.error(`Error in creating branch ${err}`);
            return { branchSHA: mainBranchHeadSHA, branchName: this.app.branchName };
        }
    }
    public async run(ref: string) {
        const { newRepo , newOwner } = await this.fork();
        if (!(newRepo && newOwner)) {
            return {};
        }
        const { branchSHA, branchName } = await this.branch(newOwner, newRepo, ref);
        if (!(branchSHA && branchName)) {
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

    // private async createBlobs(changes: Files, owner: string, repoName: string) {
    //     const self = this;
    //     const blobs: Promise<any>[] = [];
    //     for (const path in changes) {
    //         const promise = new Promise(async (resolve, reject) => {
    //             const content = changes[path];
    //             const blobSHA = (await self.app.octokit.git.createBlob({
    //                 owner,
    //                 repo: repoName,
    //                 content
    //             })).data.sha;
    //             if (!blobSHA) reject(null);
    //             resolve({ path, sha: blobSHA });
    //         });
    //         blobs.push(promise);
    //     }
    //     return Promise.all(blobs);
    // }

    /**
     * Create a github tree and return its SHA
     * @param changes 
     * @param owner 
     * @param repoName 
     */
    private async createTree(changes: Files, owner: string, repoName: string, branchSHA: string): Promise<string> {
        const tree: GitCreateTreeParamsTree[] = [];
        for (const path in changes) {
            tree.push({
                path,
                mode: "100644",
                type: "blob",
                content: changes[path]
            });
        }
        const oldTreeSHA = (await this.app.octokit.git.getCommit({
            owner: owner,
            repo: repoName,
            commit_sha: branchSHA
        })).data.tree.sha;
        // tree.push({
        //     path: "",
        //     mode: "040000",
        //     type: "tree",
        //     sha: oldTreeSHA
        // });
        const treeSHA = (await this.app.octokit.git.createTree({
            owner: owner,
            repo: repoName,
            tree: tree,
            base_tree: oldTreeSHA
        })).data.sha;
        return treeSHA;
    }

    private async commitToBranch(branchSHA: string, treeSHA: string, owner: string, repoName: string) {
        const commitData = await this.app.octokit.git.createCommit({
            owner: owner,
            repo: repoName,
            message: "Third-Party Changes",
            tree: treeSHA,
            parents: [ branchSHA ]
        });
        console.log(commitData);
        return commitData.data.sha;
    }


    private async updateBranchReference(
        newSHA: string,
        ref: string,
        owner: string,
        repo: string
    ) {
        console.log(newSHA, ref, owner, repo)
        const data = await this.app.octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${this.app.branchName}`,
            sha: newSHA
        });
        console.log(data)
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
    
    public async run(changes: Files, owner: string, repoName: string, branchSHA: string, ref: string) {
        // const blobs = await this.createBlobs(changes, owner, repoName);
        const treeSHA = await this.createTree(changes, owner, repoName, branchSHA);
        if (!treeSHA) return;
        const commitSHA = await this.commitToBranch(branchSHA, treeSHA, owner, repoName);
        console.log(`tree sha: ${treeSHA}, `)
        await this.updateBranchReference(commitSHA, ref, owner, repoName);
    }

}

async function runGitHub(app: Application) {
    const ref = `refs/heads/${app.branchName}`;
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
    const { branchSHA, owner, repoName } = await (new ForkAndBranch(app, ownerOriginal, repoOriginal)).run(ref);
    if (!(owner && repoName && branchSHA)) return;
    // create PR
    const pushPRHandler = new PushAndPR(app);
    await pushPRHandler.run(changes, owner, repoName, branchSHA, ref);
}

export { runGitHub }