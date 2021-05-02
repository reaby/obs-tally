"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WebSocketServer {
    constructor(io, obs) {
        this.io = io;
        this.obs = obs;
        this.rtcConnections = [];
        this.currentScene = "";
        this.scenes = undefined;
        obs.sendCallback("GetSceneList", (err, data) => {
            var _a, _b;
            this.scenes = (_a = data === null || data === void 0 ? void 0 : data.scenes) !== null && _a !== void 0 ? _a : [];
            this.currentScene = (_b = data === null || data === void 0 ? void 0 : data["current-scene"]) !== null && _b !== void 0 ? _b : "";
        });
        obs.on("SwitchScenes", (data) => {
            this.currentScene = data["scene-name"];
            io.emit("SwitchScene", this.currentScene);
        });
        io.on("connection", (socket) => {
            this.rtcConnections.push(socket);
            // console.log("connect:" + socket.id);
            socket.emit("scenes", this.scenes, this.currentScene);
            socket.emit("get_peers", {
                connections: this.getConnectionIds(),
                you: socket.id,
            });
            io.emit("new_peer_connected", { socketId: socket.id });
            socket.on("getScenes", () => {
                socket.emit("scenes", this.scenes, this.currentScene);
            });
            socket.on("send_ice_candidate", (data) => {
                const soc = this.getSocket(data.socketId);
                soc === null || soc === void 0 ? void 0 : soc.emit("receive_ice_candidate", {
                    candidate: data.candidate,
                    socketId: socket.id,
                });
            });
            socket.on("send_offer", (data) => {
                // console.log("send_offer", data);
                const soc = this.getSocket(data.socketId);
                soc === null || soc === void 0 ? void 0 : soc.emit("receive_offer", {
                    sdp: data.sdp,
                    socketId: socket.id,
                });
            });
            socket.on("send_answer", (data) => {
                const soc = this.getSocket(data.socketId);
                soc === null || soc === void 0 ? void 0 : soc.emit("receive_answer", {
                    sdp: data.sdp,
                    socketId: socket.id,
                });
            });
            socket.on("disconnect", () => {
                const i = this.rtcConnections.indexOf(socket);
                this.rtcConnections.splice(i, 1);
                // console.log("disconnect:" + socket.id);
                io.emit("remove_peer_connected", { socketId: socket.id });
            });
        });
    }
    getSocket(id) {
        for (const socket of this.rtcConnections) {
            if (id === socket.id) {
                return socket;
            }
        }
        return null;
    }
    getConnectionIds() {
        const ids = [];
        for (const socket of this.rtcConnections) {
            ids.push(socket.id);
        }
        console.log(ids);
        return ids;
    }
}
exports.default = WebSocketServer;
