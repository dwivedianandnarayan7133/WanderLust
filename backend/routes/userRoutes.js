const express = require("express");
const router = express.Router();
const users = require("../controllers/userController.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/register", users.registerForm);
router.post("/register", wrapAsync(users.register));
router.get("/login", users.loginForm);
router.post("/login", users.login);
router.post("/logout", users.logout);

module.exports = router;