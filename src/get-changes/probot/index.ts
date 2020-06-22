import { Files } from "../../types";

class Changes {
    public async get(): Promise<Files> {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }

}
export { Changes }