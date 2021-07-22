const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("HERE");
  res.status(200).send({ message: "SUCCESS" });
});

router.post("/upload", (req, res) => {
  let data = "";
  req.on("data", (chunk) => {
    console.log(chunk);
    data += chunk;
  });
  req.on("end", () => {
    
    res.status(200).send({ message: "Upload completed" });
  });

});

module.exports = router;
