import { Application } from "../../application";
import * as HTTPS from "https";
import {Files, ResponseBody} from "../../types";

async function handleChange(
    app: Application,
    repo_url: string,
    forkOwner: string,
    forkedRepo: string
): Promise<Files> {
    return new Promise((res, rej) => {
        var responseMsg = '';
        HTTPS.get(repo_url, (resp) => {
            resp.on('data', (chunk) => {
                responseMsg += chunk;
            });

            resp.on('end', () => {
                app.log.debug(`Request to ${repo_url} finished.`);
                const fsFiles: Files = JSON.parse(responseMsg).data;
                res(fsFiles);
            });
        }).on("error", (err) => {
            app.log.error(`Request to ${repo_url} failed with error: ${err}`);
            rej();
        });
    });
}

export { handleChange }