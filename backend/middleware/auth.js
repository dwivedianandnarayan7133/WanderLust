const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");

const safeReturnTo = (value, fallback = "/listings") => {
    if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
        return value;
    }
    return fallback;
};

const requireLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        const returnTo = safeReturnTo(req.body?.returnTo || req.query.returnTo, req.originalUrl);
        return res.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    next();
};

const requireListingOwner = wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        throw new ExpressError(403, "You can only manage listings you created.");
    }

    req.listing = listing;
    next();
});

const requireReviewOwner = wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");

    const isAttachedReview = listing.reviews.some((reviewId) => reviewId.equals(req.params.reviewId));
    if (!isAttachedReview) throw new ExpressError(404, "Review not found");

    const review = await Review.findById(req.params.reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    if (!review.author || !review.author.equals(req.user._id)) {
        throw new ExpressError(403, "You can only manage reviews you created.");
    }

    req.listing = listing;
    req.review = review;
    next();
});

module.exports = { safeReturnTo, requireLogin, requireListingOwner, requireReviewOwner };