import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import userRouter from "./routers/users.routes.js";
import messageRouter from "./routers/messages.routes.js";
import notificationRouter from "./routers/notification.routes.js";
import connect from "./config/mongodb.connection.js";
import socketHandler from "./sockets/index.js";
import { instrument } from "@socket.io/admin-ui";
import { pubClient, subClient } from "./config/redis.connection.js";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config();

const socketPort = process.env.SOCKET_PORT || 3000;
const appPort = process.env.APP_PORT || 3001;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const api = express.Router();

api.use("/users", userRouter);
api.use("/messages", messageRouter);
api.use("/push", notificationRouter);

app.use("/api", api);

connect(process.env.MONGODB_URL);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://admin.socket.io"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6,
});

io.adapter(createAdapter(pubClient, subClient));

instrument(io, {
  auth: process.env.SOCKET_IO_ADMIN_PASSWORD
    ? {
        password: process.env.SOCKET_IO_ADMIN_PASSWORD,
      }
    : false,
});

socketHandler(io);

export const socketServer = server.listen(socketPort, () => {
  console.log(`Socket listening at ${socketPort}`);
});

export const appServer = app.listen(appPort, () => {
  console.log(`App listening at ${appPort}`);
});
