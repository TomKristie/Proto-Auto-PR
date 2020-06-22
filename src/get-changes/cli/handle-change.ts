import { execSync } from "child_process";


function handleChange(localPath: string): void {
    console.log(localPath)
    execSync(
        `echo "${new Date()}" >> Readme.md`,
        { cwd: localPath }
    );
}

export { handleChange }