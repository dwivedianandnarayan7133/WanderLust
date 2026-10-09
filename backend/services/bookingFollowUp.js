const Booking = require("../models/booking.js");
const { sendEmail } = require("./mailer.js");

let processing = false;

exports.processDueFollowUps = async () => {
    if (processing) return;
    processing = true;

    try {
        const checkoutDayEnded = new Date();
        checkoutDayEnded.setUTCHours(0, 0, 0, 0);
        checkoutDayEnded.setTime(checkoutDayEnded.getTime() - 1);
        const bookings = await Booking.find({
            status: "confirmed",
            checkOut: { $lte: checkoutDayEnded },
            followUpSentAt: null,
        })
            .limit(20)
            .populate("guest")
            .populate("listing");

        for (const booking of bookings) {
            const sent = await sendEmail({
                to: booking.guest?.email,
                subject: `How was your stay at ${booking.listing?.title || "your destination"}?`,
                text: `Hi ${booking.guest?.username || "there"},\n\nWe hope you enjoyed your stay at ${booking.listing?.title || "your destination"}. Please share your experience by leaving a review on WanderLust.\n\nThank you for booking with us.`,
            });
            if (sent) {
                booking.followUpSentAt = new Date();
                await booking.save();
            }
        }
    } catch (error) {
        console.error("Unable to process booking follow-up emails:", error);
    } finally {
        processing = false;
    }
};