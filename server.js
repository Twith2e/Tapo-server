const express = require("express");
const app = express();
require("./middleware/googleauth");
const expressSession = require("express-session");
const passport = require("passport");
const connect = require("./config/mongodb.connection");
const bodyParser = require("body-parser");
const cors = require("cors");
const otpRouters = require("./routers/users.routers");
const { googleCallback } = require("./controllers/users.controller");
require("dotenv").config();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  expressSession({
    secret: "tee",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", otpRouters);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/dashboard", (req, res) => {
  res.send(`Welcome`);
});

app.get("/auth/google/callback", googleCallback);

connect(process.env.MONGODB_URL);

app.listen(port, () => {
  console.log(`Example app listening at  ${port}`);
});
