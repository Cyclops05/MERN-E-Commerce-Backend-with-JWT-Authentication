const express = require("express");
const { registerUser, loginUser, getAllUsers } = require("../controller/controller.user");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getAllUsers);

module.exports = router;
