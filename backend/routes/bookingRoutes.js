const express = require("express");
const router = express.Router();
const bookings = require("../controllers/bookingController.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/", wrapAsync(bookings.index));
router.get("/:bookingId", wrapAsync(bookings.show));
router.post("/:bookingId/cancel", wrapAsync(bookings.cancel));

module.exports = router;