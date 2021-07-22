const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("HERE");
  res.status(200).send({ message: "SUCCESS" });
});

router.post("/upload", (req, res) => {
  res.status(200).send({message: "SUCCESSFULLY CONNECTED TO POST ROUTE"});
});

module.exports = router;
