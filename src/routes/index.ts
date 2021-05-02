/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */

import { Request, Response, Router } from "express";
const ip = require("ip");

// Init router and path
const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.render("index", { server_ip: ip.address()});
});
/* router.get("/cast", (req: Request, res: Response) => {
  res.render("cast", { server_ip: ip.address() });
});
*/

// Export the base-router
export default router;
