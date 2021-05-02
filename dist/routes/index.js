"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ip = require("ip");
// Init router and path
const router = express_1.Router();
router.get("/", (req, res) => {
    res.render("index", { server_ip: ip.address() });
});
/* router.get("/cast", (req: Request, res: Response) => {
  res.render("cast", { server_ip: ip.address() });
});
*/
// Export the base-router
exports.default = router;
