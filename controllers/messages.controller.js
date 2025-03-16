const socketio = require("socket.io");
const appServer = require("../server");

const io = socketio(appServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id, "has joined our server");
});
