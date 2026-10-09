const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const { sendEmail } = require("../services/mailer.js");

const sendBookingEmails = async (booking, guest, listing) => {
    const checkIn = booking.checkIn.toISOString().slice(0, 10);
    const checkOut = booking.checkOut.toISOString().slice(0, 10);
    const details = `${listing.title}\n${checkIn} to ${checkOut} (${booking.nights} nights)\n${booking.guests} guest(s)\nTotal: INR ${booking.totalPrice.toLocaleString("en-IN")}`;

    try {
        await sendEmail({
            to: guest.email,
            subject: `Booking confirmed: ${listing.title}`,
            text: `Hi ${guest.username},\n\nYour stay is confirmed.\n\n${details}\n\nYou can review or cancel this booking from your WanderLust bookings page.`,
        });
        if (listing.owner?.email) {
            await sendEmail({
                to: listing.owner.email,
                subject: `New booking: ${listing.title}`,
                text: `${guest.username} booked your listing.\n\n${details}`,
            });
        }
    } catch (error) {
        console.error("Unable to send booking confirmation emails:", error);
    }
};

exports.create = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("owner");
    if (!listing) throw new ExpressError(404, "Listing not found");

    const checkIn = new Date(req.body.booking.checkIn);
    const checkOut = new Date(req.body.booking.checkOut);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today) throw new ExpressError(400, "Check-in must be today or a future date.");

    const nights = Math.round((checkOut - checkIn) / (24 * 60 * 60 * 1000));
    const totalPrice = nights * listing.price;
    const booking = new Booking({
        listing: listing._id,
        guest: req.user._id,
        checkIn,
        checkOut,
        guests: Number(req.body.booking.guests),
        nights,
        pricePerNight: listing.price,
        totalPrice,
    });

    const reservedListing = await Listing.findOneAndUpdate({
        _id: listing._id,
        reservations: {
            $not: {
                $elemMatch: {
                    checkIn: { $lt: checkOut },
                    checkOut: { $gt: checkIn },
                },
            },
        },
    }, {
        $push: {
            reservations: { booking: booking._id, checkIn, checkOut },
        },
    }, { new: true });

    if (!reservedListing) {
        throw new ExpressError(409, "Those dates are no longer available. Please choose different dates.");
    }

    try {
        await booking.save();
    } catch (error) {
        await Listing.updateOne(
            { _id: listing._id },
            { $pull: { reservations: { booking: booking._id } } }
        );
        throw error;
    }

    await sendBookingEmails(booking, req.user, listing);
    res.redirect(`/bookings/${booking._id}`);
};

exports.index = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .sort({ checkIn: -1 })
        .populate("listing");
    res.render("bookings/index.ejs", { bookings });
};

exports.show = async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.bookingId, guest: req.user._id })
        .populate("listing");
    if (!booking) throw new ExpressError(404, "Booking not found");
    res.render("bookings/show.ejs", { booking });
};

exports.cancel = async (req, res) => {
    const booking = await Booking.findOne({
        _id: req.params.bookingId,
        guest: req.user._id,
        status: "confirmed",
        checkIn: { $gt: new Date() },
    }).populate({ path: "listing", populate: { path: "owner" } });
    if (!booking) throw new ExpressError(404, "Upcoming confirmed booking not found.");
    if (!booking.listing) throw new ExpressError(404, "The listing for this booking is no longer available.");

    booking.status = "cancelled";
    await booking.save();
    await Listing.updateOne(
        { _id: booking.listing._id },
        { $pull: { reservations: { booking: booking._id } } }
    );
    await sendEmail({
        to: req.user.email,
        subject: `Booking cancelled: ${booking.listing.title}`,
        text: `Hi ${req.user.username},\n\nYour booking for ${booking.listing.title} has been cancelled.`,
    }).catch((error) => console.error("Unable to send booking cancellation email:", error));
    if (booking.listing.owner?.email) {
        await sendEmail({
            to: booking.listing.owner.email,
            subject: `Booking cancelled: ${booking.listing.title}`,
            text: `${req.user.username} cancelled their booking for ${booking.listing.title}. The dates are available again.`,
        }).catch((error) => console.error("Unable to send host cancellation email:", error));
    }
    res.redirect("/bookings");
};