import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import userRouter from "./routers/users.routers.js";
import connect from "./config/mongodb.connection.js";
import socketHandler from "./sockets/index.js";
import { instrument } from "@socket.io/admin-ui";
import dotenv from "dotenv";

dotenv.config();

const socketPort = process.env.PORT || 3000;
const appPort = process.env.PORT || 3001;

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

app.use("/users", userRouter);

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

instrument(io, {
  auth: false,
});

socketHandler(io);

export const socketServer = server.listen(socketPort, () => {
  console.log(`Socket listening at ${socketPort}`);
});

export const appServer = app.listen(appPort, () => {
  console.log(`App listening at ${appPort}`);
});
