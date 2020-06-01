require('dotenv').config({path: './config/.env'})
const express = require("express");

//execute the codes in the mongoose.js
require("./db/mongoose");
const userRouter = require("./routes/user");
const taskRouter = require("./routes/task");

const app = express();
const port = process.env.PORT;

//parse request body from json to object
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log("server started on " + port);
});
