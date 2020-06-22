// The GitHub App context type
type Context = any;

// Response body from http requests
interface ResponseBody { data: any }

// a flat object of the path of the file as the key, and the text contents as a value
interface Files { [index: string]: string }


type organizationName = string;
type accountName = string;

type Owner = organizationName | accountName;


enum Flavour {
    Probot = "Probot",
    CLI = "CLI",
    Action = "Action"
}

enum LogLevel {
    info = "info",
    trace = "trace",
    debug = "debug",
    warn = "warn",
    error = "error",
    fatal = "fatal",
}

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
 * Authenticate needs installation Id. Without the installation Id
 * `context.payload.installation.id`
 */
class ProbotAuth {
    readonly installationId: number;

    constructor(installationId: number) {
        this.installationId = installationId;
    }
}

export {
    Context,
    Credentials,
    Files,
    Flavour,
    LogLevel,
    Owner,
    ProbotAuth,
    ResponseBody,
    TokenAuth
}