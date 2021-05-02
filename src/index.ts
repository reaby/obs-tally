/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
import "./preStart"; // Must be the first import
import { httpsServer } from "@server";
const ip = require("ip");


// Start the server
const port = Number(443);

httpsServer.listen(port, () => {
  console.log("App started, access at https://" + ip.address());
});
