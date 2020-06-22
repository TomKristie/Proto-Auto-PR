import { execSync } from "child_process";

function handleChange(): void {
    execSync(`echo "${new Date()}" >> Readme.md`);
}

export { handleChange }