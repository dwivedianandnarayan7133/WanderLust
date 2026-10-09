const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        required: true,
    },
    guests: {
        type: Number,
        min: 1,
        required: true,
    },
    nights: {
        type: Number,
        min: 1,
        required: true,
    },
    pricePerNight: {
        type: Number,
        min: 0,
        required: true,
    },
    totalPrice: {
        type: Number,
        min: 0,
        required: true,
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed",
    },
    followUpSentAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);