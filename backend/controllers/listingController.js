const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const ExpressError = require("../utils/ExpressError.js");
const { safeReturnTo } = require("../middleware/auth.js");

exports.index = async (req, res) => {
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = searchQuery ? {
        $or: [
            { title: new RegExp(escapedQuery, "i") },
            { location: new RegExp(escapedQuery, "i") },
            { country: new RegExp(escapedQuery, "i") },
        ],
    } : {};
    const alllistings = await Listing.find(filter).populate("owner");
    res.render("listings/index.ejs", { alllistings, searchQuery });
};

exports.new = (req, res) => {
    res.render("listings/new.ejs");
};

exports.show = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate("owner")
        .populate({ path: "reviews", populate: { path: "author" } });
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.render("listings/show.ejs", { listing });
};

exports.create = async (req, res) => {
    const listingData = { ...req.body.listing };
    if (listingData.image && (!listingData.image.url || listingData.image.url.trim() === "")) {
        delete listingData.image;
    }

    const newListing = new Listing({ ...listingData, owner: req.user._id });
    await newListing.save();
    res.redirect("/listings");
};

exports.edit = (req, res) => {
    res.render("listings/edit.ejs", { listing: req.listing });
};

exports.update = async (req, res) => {
    const listingData = { ...req.body.listing };
    delete listingData.owner;
    if (listingData.image && (!listingData.image.url || listingData.image.url.trim() === "")) {
        delete listingData.image;
    }

    Object.assign(req.listing, listingData);
    await req.listing.save();
    res.redirect(`/listings/${req.listing._id}`);
};

exports.delete = async (req, res) => {
    const hasUpcomingBookings = await Booking.exists({
        listing: req.listing._id,
        status: "confirmed",
        checkOut: { $gt: new Date() },
    });
    if (hasUpcomingBookings) {
        throw new ExpressError(409, "This listing has upcoming confirmed bookings and cannot be deleted yet.");
    }
    await req.listing.deleteOne();
    res.redirect("/listings");
};

exports.toggleInterest = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");

    const alreadyInterested = listing.interestedUsers.some((userId) => userId.equals(req.user._id));
    if (alreadyInterested) {
        listing.interestedUsers.pull(req.user._id);
    } else {
        listing.interestedUsers.push(req.user._id);
    }

    await listing.save();
    res.redirect(safeReturnTo(req.body.returnTo, `/listings/${id}`));
};