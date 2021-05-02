"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
require("./preStart"); // Must be the first import
const _server_1 = require("@server");
const ip = require("ip");
// Start the server
const port = Number(443);
_server_1.httpsServer.listen(port, () => {
    console.log("App started, access at https://" + ip.address());
});
