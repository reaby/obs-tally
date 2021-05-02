"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpsServer = exports.app = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
require("express-async-errors");
const routes_1 = __importDefault(require("./routes"));
const Logger_1 = __importDefault(require("@shared/Logger"));
const fs = __importStar(require("fs"));
const socketio = __importStar(require("socket.io"));
const WebSocketServer_1 = __importDefault(require("./WebSocketServer"));
const obs_websocket_js_1 = __importDefault(require("obs-websocket-js"));
//import config from "config.json";
const ip = require("ip");
const obs = new obs_websocket_js_1.default();
const privateKey = fs.readFileSync("./sslcert/server.key");
const certificate = fs.readFileSync("./sslcert/server.crt");
const credentials = { key: privateKey, cert: certificate };
const app = express_1.default();
exports.app = app;
// your express configuration here
const httpsServer = https_1.default.createServer(credentials, app);
exports.httpsServer = httpsServer;
const io = new socketio.Server();
exports.io = io;
io.attach(httpsServer);
const config = JSON.parse(fs.readFileSync("./config.json").toString());
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield obs.connect({ address: config.obs.host, password: config.obs.pass });
    }
    catch (e) {
        //console.log(e);
        console.error("Failed to connect obs: " + e.description);
        console.error("Exiting app.");
        process.exit(1);
    }
    const webSocket = new WebSocketServer_1.default(io, obs);
}))();
// const webRTC = require('webrtc.io').listen(httpsServer);
const { BAD_REQUEST } = http_status_codes_1.default;
/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookie_parser_1.default());
// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
    app.use(morgan_1.default("dev"));
}
// Security
if (process.env.NODE_ENV === "production") {
    // app.use(helmet());
}
// Add APIs
app.use("/", routes_1.default);
// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    Logger_1.default.err(err, true);
    return res.status(BAD_REQUEST).json({
        error: err.message,
    });
});
/************************************************************************************
 *                              Serve front-end content
 ***********************************************************************************/
const viewsDir = path_1.default.join(__dirname, "views");
app.set("views", viewsDir);
app.set("view engine", "hbs");
const staticDir = path_1.default.join(__dirname, "public");
app.use(express_1.default.static(staticDir));
