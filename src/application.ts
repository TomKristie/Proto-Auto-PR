import { log, Logger } from "./wrap-logger";
import { Octokit } from "@octokit/rest";
import { Config } from "./config"
import { Context, Credentials, Flavour, ProbotAuth, TokenAuth } from "./types";

interface Parameters {
    context?: Context;
    app?: any;
    hasWriteAccess: boolean;
}

class Application {
    static readonly repoRoot = "repos";
    hasWriteAccess: boolean;
    flavour: Flavour;
    octokit!: Octokit;
    git!: Octokit;
    log!: Logger;
    credentials!: TokenAuth | ProbotAuth;
    branchName: string;

    constructor(params: Parameters) {
        this.hasWriteAccess = params.hasWriteAccess;
        this.flavour = Config.flavour
        this.setupLogger(params);
        this.setupAuthentication(params);
        this.log.info("done setup")
        this.branchName = "third-party"
    }

    private setupLogger(params: Parameters) {
        switch (Config.flavour) {
            case Flavour.Action, Flavour.CLI: {
                this.log = log;
                break;
            }
            case Flavour.Probot: {
                // use probot logger since probot will only display context.log logs
                if (!params.context || !params.context.log) {
                    throw new Error(`Error binding \"context.log\"`);
                }
                this.log = params.context.log;
                break;
            }
            default: {
                this.log = log;
                this.log.error(`Unrecognized flavour \"${Config.flavour}\" specified.`);
            }
        }
    }

    private setupAuthentication(params: Parameters) {
        switch (Config.flavour) {
            case Flavour.Action: {
                this.setupProbot(params.context);
                break;
            }
            case Flavour.CLI: {
                // TODO - handle parameters
                this.setupCLI();
                break;
            }
            case Flavour.Probot: {
                this.setupAction();
                break;
            }
            default: {
                this.log.error(`Unrecognized flavour \"${Config.flavour}\" specified.`);
            }
        }
    }

    private setupProbot(context: any) {
        try {
            this.credentials = new ProbotAuth(context.payload.installation.id);
        } catch (e) {
            this.credentials 
        }
    }

    private setupCLI() {
        this.authenticateWithToken();
    }

    private setupAction() {
        this.authenticateWithToken();
    }

    private authenticateWithToken() {
        const token: Credentials.ACCESS_TOKEN = <Credentials.ACCESS_TOKEN> process.env[Credentials.ACCESS_TOKEN];
        if (!token) {
            throw new Error(`process.env[\"${Credentials.ACCESS_TOKEN}\"] is null or undefined`);
        }
        this.credentials = new TokenAuth(token);
        this.octokit = new Octokit({
            auth: token
        });
    }

}

export {
    Application,
    TokenAuth
}