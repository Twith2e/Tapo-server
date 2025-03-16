const express = require("express");
const app = express();
const ejs = require("ejs");
const session = require("express-session");
const connect = require("./config/mongodb.connection");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRouter = require("./routers/users.routers");
// const messageRouter = require("./routers/messages.routers");
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/users", userRouter);
// app.use("/message", messageRouter);

connect(process.env.MONGODB_URL);

const appServer = app.listen(port, () => {
  console.log(`App listening at ${port}`);
});

const socketio = require("socket.io");

const io = socketio(appServer, {
  cors: {
    origin: "*",
  },
});

io.on("connect", (socket) => {
  console.log(socket.id, "has joined our server");
  socket.emit("welcome", [1, 2, 3]);
  socket.on("thankYou", (data) => {
    console.log(data);
  });
});

module.exports = appServer;
