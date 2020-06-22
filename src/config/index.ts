import * as temp from "../../workflow.json";
import { Owner } from "../types";
import { Flavour, LogLevel } from "../types";

interface ThirdPartySettings {
    repoName: string;
    owner: Owner;
    includes: string[];
    excludes: string[];
    rootDirs: string[];
}


interface Config {
    flavour: Flavour;
    writeAccess?: boolean;
    logLevel?: LogLevel;
    thirdParties?: {
        [url: string]: ThirdPartySettings;   
    };
}


function setup(): Config {
    const config: any = {};

    config.flavour = <Flavour>temp.flavour;
    config.writeAccess = temp.writeAccess || true;
    config.logLevel = <LogLevel>temp.logLevel || LogLevel.warn;

    // handle required varables
    if (!config.flavour) throw Error("Flavour not supplied");

    return <Config>config
}

var config: Config = setup()


export { config as Config }