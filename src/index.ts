import { Application } from "./application";
import { runGitHub } from "./handle-github";
import * as fs from "fs";

function hasWriteAccess() {
   try {
      fs.accessSync('.', fs.constants.R_OK | fs.constants.W_OK);
      return true;
   } catch (err) {
      return false;
   }
}

async function main() {
   const writeAccess = hasWriteAccess();
   const app: Application = new Application({ hasWriteAccess: writeAccess });
   runGitHub(app);
}
main();