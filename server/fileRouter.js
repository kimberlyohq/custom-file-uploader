const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("HERE");
  res.status(200).send({ message: "SUCCESS" });
});

module.exports = router;
