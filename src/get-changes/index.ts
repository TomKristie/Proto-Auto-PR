
import { Changes as ActionChanges } from "./action"
import { Changes as CLIChanges } from "./cli"
import { Changes as ProbotChanges } from "./probot"
import { Application } from "../application"
import { Files, Flavour } from "../types";

class Changes {
    public get: (() => Promise<Files>);

    constructor(app: Application, owner: string, repoName: string) {
        app.log.debug("Starting 3p changes");
        let change:  ActionChanges | CLIChanges | ProbotChanges;
        switch(app.flavour) {
            case (Flavour.Action): {
                change = new ActionChanges();
                this.get = change.get;
                break;
            }
            case (Flavour.CLI): {
                app.log.debug("CLI HIT")
                change = new CLIChanges(app, owner, repoName);
                this.get = change.get;
                break;
            }
            case (Flavour.Probot): {
                change = new ProbotChanges();
                this.get = change.get;
                break;
            }
            default: {
                app.log.fatal(`Invalid app medium ${app.flavour}`);
                this.get = () => new Promise((res, rej) => {});
            }
        }

        app.log.debug("Done 3p changes");
    }
}

export { Changes }