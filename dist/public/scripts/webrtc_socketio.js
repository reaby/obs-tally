//CLIENT
// Fallbacks for vendor-specific variables until the spec is finalized.
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.RTCPeerConnection;
var URL = window.URL || window.webkitURL || window.msURL || window.oURL || window.mozURL;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var inboundStream = null;

var rtc = {};
rtc._events = {};

rtc.on = function (eventName, callback) {
  rtc._events[eventName] = rtc._events[eventName] || [];
  rtc._events[eventName].push(callback);
};

rtc.fire = function (eventName, _) {
  var events = rtc._events[eventName];
  var args = Array.prototype.slice.call(arguments, 1);

  if (!events) {
    return;
  }

  for (var i = 0, len = events.length; i < len; i++) {
    events[i].apply(null, args);
  }
};

// Referenc e to the lone PeerConnection instance.
rtc.peerConnections = {};

// Array of known peer socket ids
rtc.connections = [];
// Stream-related variables.
rtc.tracks = [];
rtc.numStreams = 0;
rtc.initializedStreams = 0;

/**
 * Connects to the websocket server.
 */
socket.on("connect", () => {
  console.log("connected");
});

socket.on("close", (data) => {
  delete rtc.peerConnections[socket.id];
});

socket.on('get_peers', function (data) {
  rtc.connections = data.connections;
  // fire connections event and pass peers
  rtc.fire('connections', rtc.connections);
});

socket.on('receive_ice_candidate', function (data) {  
  rtc.peerConnections[data.socketId].addIceCandidate(data.candidate);

  rtc.fire('receive ice candidate', data.candidate);
});

socket.on('new_peer_connected', function (data) {
  rtc.connections.push(data.socketId);
  let pc = rtc.createPeerConnection(data.socketId);
  for (let data of rtc.tracks) {
    pc.addTrack(data.track);
  }
});

socket.on('remove_peer_connected', function (data) {
  rtc.fire('disconnect stream', data.socketId);
  console.log("removeconnection");

  delete rtc.peerConnections[data.socketId];
});

socket.on('receive_offer', function (data) {
  rtc.receiveOffer(data.socketId, data.sdp);
  rtc.fire('receive offer', data);
});

socket.on('receive_answer', function (data) {
  rtc.receiveAnswer(data.socketId, data.sdp);
  rtc.fire('receive answer', data);
});



rtc.sendOffers = function () {
  for (var i = 0, len = rtc.connections.length; i < len; i++) {
    var socketId = rtc.connections[i];
    rtc.sendOffer(socketId);
  }
}

rtc.onClose = function (data) {
  rtc.on('close_stream', function () {
    rtc.fire('close_stream', data);
  });
}

rtc.createPeerConnections = function () {
  for (var i = 0; i < rtc.connections.length; i++) {
    rtc.createPeerConnection(rtc.connections[i]);
  }
};

rtc.createPeerConnection = function (id) {
  console.log('createPeerConnection');
  const configuration = {
    iceServers: [{ urls: "stun:stun.1.google.com:19302" }]
  };
  var pc = rtc.peerConnections[id] = new PeerConnection(configuration) /* rtc.SERVER, function (candidate, moreToFollow) { */
  pc.onopen = function () {
    // TODO: Finalize this API
    rtc.fire('peer connection opened');
  };
  pc.onicecandidate = function (event) {
    let candidate = event.candidate;    
    if (candidate) {
      socket.emit('send_ice_candidate',
        {          
          "candidate": candidate,
          "socketId": id
        });
    }
  }

  pc.ontrack = function (event) {
    // TODO: Finalize this API
    console.log("on remote Track", event);
    rtc.fire('add remote stream', event);
  };
  return pc;
}

rtc.sendOffer = function (socketId) {
  console.log("sendOffer");
  let pc = rtc.peerConnections[socketId];
  pc.createOffer().then(offer => {
    return pc.setLocalDescription(offer)
  }).then(() => {
    socket.emit("send_offer",
      {
        "socketId": socketId,
        "sdp": pc.localDescription
      }
    );
  });
}


rtc.receiveOffer = function (socketId, sdp) {
  var pc = rtc.peerConnections[socketId];
  console.log("receive offer", pc);
  pc.setRemoteDescription(sdp).then(() => {
    rtc.sendAnswer(socketId);
  });
};


rtc.sendAnswer = async function (socketId) {
  console.log("send answer");
  let pc = rtc.peerConnections[socketId];
  var answerr = null;
  pc.createAnswer().then(answer => {
    answerr = answer;
    return pc.setLocalDescription(answer);
  }).then(() => {
    socket.emit("send_answer", {
      "socketId": socketId,
      "sdp": answerr
    });
  });
};


rtc.receiveAnswer = function (socketId, sdp) {
  console.log("receive answer");
  var pc = rtc.peerConnections[socketId];
  pc.setRemoteDescription(sdp);
};


rtc.createStream = async function (opt) {
  var options = {
    video: opt.video || false,
    audio: opt.audio || false
  };

  if (getUserMedia) {
    try {
      const theStream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: true });
      for (const track of theStream.getTracks()) {
        rtc.tracks.push({ track: track, stream: theStream });
      }
    } catch (e) {
      console.log("error while creating tracks:" + e);
    }
    rtc.fire('ready');
  } else {
    alert('webRTC is not yet supported in this browser.');

  }
}


rtc.addStreams = function () {
  for (let data of rtc.tracks) {
    for (let connection in rtc.peerConnections) {
      rtc.peerConnections[connection].addTrack(data.track);
    }
  }
};



rtc.attachStream = function (ev, domId) {
  if (ev.streams && ev.streams[0]) {
    document.getElementById(domId).srcObject = ev.streams[0];
  } else {
    if (!inboundStream) {
      inboundStream = new MediaStream();
      document.getElementById(domId).srcObject = inboundStream;
    }
    inboundStream.addTrack(ev.track);
  }
};

rtc.on('ready', function () {
  console.log("ready");
  rtc.createPeerConnections();
  rtc.addStreams();
  rtc.sendOffers();
});
