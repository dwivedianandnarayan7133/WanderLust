const express = require("express");
const router = express.Router();
const listings = require("../controllers/listingController.js");
const reviews = require("../controllers/reviewController.js");
const bookings = require("../controllers/bookingController.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { requireLogin, requireListingOwner, requireReviewOwner } = require("../middleware/auth.js");
const { validateListing, validateReview, validateBooking } = require("../middleware/validate.js");

router.route("/")
    .get(wrapAsync(listings.index))
    .post(requireLogin, validateListing, wrapAsync(listings.create));

router.get("/new", requireLogin, listings.new);
router.post("/:id/interest", requireLogin, wrapAsync(listings.toggleInterest));
router.post("/:id/reviews", requireLogin, validateReview, wrapAsync(reviews.create));
router.put("/:id/reviews/:reviewId", requireLogin, requireReviewOwner, validateReview, wrapAsync(reviews.update));
router.delete("/:id/reviews/:reviewId", requireLogin, requireReviewOwner, wrapAsync(reviews.delete));
router.post("/:id/bookings", requireLogin, validateBooking, wrapAsync(bookings.create));

router.get("/:id/edit", requireLogin, requireListingOwner, listings.edit);
router.put("/:id", requireLogin, requireListingOwner, validateListing, wrapAsync(listings.update));
router.delete("/:id", requireLogin, requireListingOwner, wrapAsync(listings.delete));
router.get("/:id", wrapAsync(listings.show));

module.exports = router;