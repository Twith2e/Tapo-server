const express = require("express");
const app = express();
const ejs = require("ejs");
const session = require("express-session");
const connect = require("./config/mongodb.connection");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRouter = require("./routers/users.routers");
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

connect(process.env.MONGODB_URL);

app.listen(port, () => {
  console.log(`Example app listening at ${port}`);
});
