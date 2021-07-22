const express = require("express");
const fileRouter = require("./fileRouter");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 8000;

// Routes
app.use("/files", fileRouter);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
