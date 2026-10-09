const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");

exports.create = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");

    const { rating, comment } = req.body.review;
    const review = new Review({
        username: req.user.username,
        author: req.user._id,
        rating,
        comment,
    });
    listing.reviews.push(review);
    await review.save();
    await listing.save();
    res.redirect(`/listings/${listing._id}`);
};

exports.update = async (req, res) => {
    const { rating, comment } = req.body.review;
    req.review.rating = rating;
    req.review.comment = comment;
    await req.review.save();
    res.redirect(`/listings/${req.listing._id}`);
};

exports.delete = async (req, res) => {
    req.listing.reviews.pull(req.review._id);
    await req.listing.save();
    await req.review.deleteOne();
    res.redirect(`/listings/${req.listing._id}`);
};