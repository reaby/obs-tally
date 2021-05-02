/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import https from "https";
import express, { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import "express-async-errors";
import BaseRouter from "./routes";
import logger from "@shared/Logger";
import * as fs from "fs";
import * as socketio from "socket.io";
import WebSocketServer from "./WebSocketServer";
import ObsWebSocket from "obs-websocket-js";
//import config from "config.json";

const ip = require("ip");
const obs = new ObsWebSocket();

const privateKey = fs.readFileSync("./sslcert/server.key");
const certificate = fs.readFileSync("./sslcert/server.crt");

const credentials = { key: privateKey, cert: certificate };
const app = express();

// your express configuration here
const httpsServer: https.Server = https.createServer(credentials, app);
const io: socketio.Server = new socketio.Server();
io.attach(httpsServer);
const config = JSON.parse(fs.readFileSync("./config.json").toString());

(async () => {
  try {
    await obs.connect({ address: config.obs.host, password: config.obs.pass });
  } catch (e) {
    //console.log(e);
    console.error("Failed to connect obs: " + e.description);
    console.error("Exiting app.");
    process.exit(1);
  }
  const webSocket = new WebSocketServer(io, obs);
})();

// const webRTC = require('webrtc.io').listen(httpsServer);
const { BAD_REQUEST } = StatusCodes;

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Security
if (process.env.NODE_ENV === "production") {
  // app.use(helmet());
}

// Add APIs
app.use("/", BaseRouter);

// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.err(err, true);
  return res.status(BAD_REQUEST).json({
    error: err.message,
  });
});

/************************************************************************************
 *                              Serve front-end content
 ***********************************************************************************/

const viewsDir = path.join(__dirname, "views");
app.set("views", viewsDir);
app.set("view engine", "hbs");

const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));

// Export express instance
export { app, httpsServer, io };
