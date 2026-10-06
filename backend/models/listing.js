const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: String,

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },

        url: {
            type: String,
            default:
                "https://media.istockphoto.com/id/2110310187/photo/luxury-tropical-pool-villa-at-dusk.jpg",
        },
    },

    price: Number,

    location: String,

    country: String,

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }],

    interestedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;