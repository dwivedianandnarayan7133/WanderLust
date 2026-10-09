const listingSchema = require("../schema.js");
const { reviewSchema } = require("../schema.js");
const { bookingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) return next(new ExpressError(400, error.message));
    next();
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) return next(new ExpressError(400, error.message));
    next();
};

const validateBooking = (req, res, next) => {
    const { error } = bookingSchema.validate(req.body);
    if (error) return next(new ExpressError(400, error.message));
    next();
};

module.exports = { validateListing, validateReview, validateBooking };