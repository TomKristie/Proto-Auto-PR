import { execSync } from "child_process";
import { Files } from "../../types";
import { handleChange } from "./handle-change";
import { Application, TokenAuth } from "../../application";


class Changes {
    private app: Application;
    private owner: string;
    private repoName: string;
    private dir: string;

    constructor (app: Application, owner: string, repoName: string) {
        this.app = app;
        this.owner = owner;
        this.repoName = repoName;
        this.dir = Changes.generateRepoDir(owner, repoName);
        this.get = this.get.bind(this);
        this.gitclone = this.gitclone.bind(this);
        this.parseChanges = this.parseChanges.bind(this);
        this.clean = this.clean.bind(this);
    }

    private static generateRepoDir(owner: string, repoName: string) {
        return `${owner}-${repoName}`
    }
    
    private gitclone() {
        try {
            const accessToken: string = (this.app.credentials as TokenAuth).accessToken;
            execSync(
                `mkdir ${this.dir} &&\
                cd ${this.dir} &&\
                git clone https://${accessToken}@github.com/${this.owner}/${this.repoName}.git`,
                { cwd: Application.repoRoot }
            );
        } catch(err) {
            this.app.log.error(`Could not git clone, ${err}`);
        }
    }
    
    /**
     * Get changes and their contents
     */
    private parseChanges(): Files {
        console.log(`${Application.repoRoot}/${this.dir}`)
        // a list of the paths of files that have been updated
        let paths: string[] = execSync(
            "git diff --name-only",
            { cwd: `${Application.repoRoot}/${this.dir}/${this.repoName}`}
        ).toString().split("\n");

        // get updated file contents
        const changes: Files = {};
        for (let i = 0; i < paths.length; i++) {
            const fileContents: string = execSync(
                `cat ${paths[i]}`,
                { cwd: `${Application.repoRoot}/${this.dir}/${this.repoName}`}
            ).toString();
            changes[paths[i]] = fileContents;
        }
        return changes;
    }
    
    /**
     * Remove any cached data
     */
    private clean() {
        execSync(`rm -rf ${this.dir}`, { cwd: Application.repoRoot });
    }
    
    
    public async get(): Promise<Files> {
        return new Promise((resolve, reject) => {
            try {
                this.gitclone();
                handleChange();
                const files: Files = this.parseChanges();
                resolve(files);
            } catch(err) {
                this.app.log.error("Error in handling CLI changes ", err);
                reject(null);
            } finally {
                this.clean();
            }
        });
    }
        
}

export { Changes }