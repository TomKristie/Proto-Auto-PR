import { log, Logger } from "./wrap-logger";
import { Octokit } from "@octokit/rest";

type Context = any;

enum Credentials {
    BOT_INSTALLATION_ID = "BOT_INSTALLATION_ID",
    ACCESS_TOKEN = "ACCESS_TOKEN"
}

class TokenAuth {
    readonly accessToken: string;
    constructor(accessToken: Credentials.ACCESS_TOKEN) {
        this.accessToken = accessToken;
    }
}

/**
 * Authenticated details for CLI flavour 
 */
class CLIAuth extends TokenAuth {}

/**
 * Authenticated details for GitHub Action flavour 
 */
class ActionAuth extends TokenAuth {}

/**
 * Authenticate needs installation Id. Without the installation Id
 * `context.payload.installation.id`
 */
class ProbotAuth {
    readonly installationId: number;

    constructor(installationId: number) {
        this.installationId = installationId;
    }
}

type Auth = ProbotAuth | CLIAuth | ActionAuth;


enum Flavour {
    Probot = "Probot",
    CLI = "CLI",
    Action = "Action"
}

interface Parameters {
    flavour: Flavour;
    context?: Context;
    app?: any;
}

class Application {
    github!: Octokit;
    log!: Logger;
    credentials!: Auth;

    constructor(params: Parameters) {
        this.setupLogger(params);
        this.setupAuthentication(params);
    }

    private setupLogger(params: Parameters) {
        switch (params.flavour) {
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
                this.log.error(`Unrecognized flavour \"${params.flavour}\" specified.`);
            }
        }
    }

    private setupAuthentication(params: Parameters) {
        switch (params.flavour) {
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
                this.log.error(`Unrecognized flavour \"${params.flavour}\" specified.`);
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
            throw new Error(`process.env.var[\"${Credentials.ACCESS_TOKEN}\"] is null or undefined`);
        }
        this.credentials = new TokenAuth(token);
        this.github = new Octokit({
            auth: token
        })
    }

}

export {
    Application
}