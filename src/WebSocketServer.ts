import ObsWebSocket, { Scene } from "obs-websocket-js";
import { Server, Socket } from "socket.io";

export default class WebSocketServer {
  io: Server;
  rtcConnections: Socket[];
  obs: ObsWebSocket;
  currentScene: string;
  scenes: Scene[] | undefined;

  constructor(io: Server, obs: ObsWebSocket) {
    this.io = io;
    this.obs = obs;
    this.rtcConnections = [];
    this.currentScene = "";
    this.scenes = undefined;
    
    obs.sendCallback("GetSceneList", (err, data) => {
      this.scenes = data?.scenes ?? [];
      this.currentScene = data?.["current-scene"] ?? "";
    });

    obs.on("SwitchScenes", (data) => {
      this.currentScene = data["scene-name"];
      io.emit("SwitchScene", this.currentScene);
    });

    io.on("connection", (socket: Socket) => {
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

      socket.on("send_ice_candidate", (data: any) => {
        const soc = this.getSocket(data.socketId);
        soc?.emit("receive_ice_candidate", {
          candidate: data.candidate,
          socketId: socket.id,
        });
      });

      socket.on("send_offer", (data: any) => {
        // console.log("send_offer", data);
        const soc = this.getSocket(data.socketId);
        soc?.emit("receive_offer", {
          sdp: data.sdp,
          socketId: socket.id,
        });
      });

      socket.on("send_answer", (data: any) => {
        const soc = this.getSocket(data.socketId);
        soc?.emit("receive_answer", {
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

  getSocket(id: string): Socket | null {
    for (const socket of this.rtcConnections) {
      if (id === socket.id) {
        return socket;
      }
    }
    return null;
  }

  getConnectionIds(): string[] {
    const ids: string[] = [];
    for (const socket of this.rtcConnections) {
      ids.push(socket.id);
    }
    console.log(ids);
    return ids;
  }
}
