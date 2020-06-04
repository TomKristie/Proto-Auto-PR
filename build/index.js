"use strict";
// import express from "express";
// const app = express();
// const port = 8080; // default port to listen
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const thirdParty = "http://google.com";
// // forward to 3rd party
// app.get( "/changes", async ( req, res ) => {
//     try {
//         const response = await fetch(thirdParty);
//         console.log(response);
//         res.send( "Hello world!" );
//     } catch(error) {
//         console.log("error")
//     }
// });
// // send changes to git
// app.post("/update", (req, res) => {
//     const data = req.body;
//     // const changes = handleData(data);; // TODO
//     // res.send(changes);
// });
// // start the Express server
// app.listen( port, () => {
//     console.log( `server started at http://localhost:${ port }` );
// } );
var fork_1 = __importDefault(require("./octokit/fork"));
fork_1.default();
//# sourceMappingURL=index.js.map