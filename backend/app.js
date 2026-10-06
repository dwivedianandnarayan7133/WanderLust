const express = require("express");
const app = express();
app.set("trust proxy", 1);
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const Review = require("./models/review.js");
const User = require("./models/user.js");
const path = require("path");
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js")
const listingSchema = require("./schema.js");
if (process.env.NODE_ENV !== "production") {
    try { require("dotenv").config(); } catch (e) {}
}

const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGODB_URI || "mongodb+srv://ananddev:PpxXIVSYPILYgBWf@cluster0.ovdb4wk.mongodb.net/wanderlust?retryWrites=true&w=majority";
const { reviewSchema, registerSchema } = require("./schema.js");
const sessionSecret = process.env.SESSION_SECRET || "wanderlustsupersecretcode2026";

main().then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, "../frontend/public")));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(session({
    store: MongoStore.create({ mongoUrl: MONGO_URL, touchAfter: 24 * 60 * 60 }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

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

app.get('/',(req,res)=>{
    res.redirect("/listings");
});

const validateListing = (req,res,next)=>{
    const { error } = listingSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }
    else{
        next();
    }
};

const validateReview = (req,res,next)=>{
    const { error } = reviewSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }
    else{
        next();
    }
};

app.get('/listings', async (req,res)=>{
   const alllistings = await Listing.find({});
   res.render("listings/index.ejs",{alllistings});
});

app.get("/register", (req, res) => {
    res.render("users/register.ejs", {
        error: null,
        returnTo: safeReturnTo(req.query.returnTo),
    });
});

app.post("/register", wrapAsync(async (req, res, next) => {
    const returnTo = safeReturnTo(req.body.returnTo);
    const { error } = registerSchema.validate(req.body);

    if (error) {
        return res.status(400).render("users/register.ejs", {
            error: error.details[0].message,
            returnTo,
        });
    }

    const { username, email, password } = req.body;
    let user;
    try {
        user = await User.register(new User({ username: username.trim(), email: email.trim() }), password);
    } catch (registrationError) {
        const message = registrationError.code === 11000
            ? "That username or email is already registered."
            : registrationError.name === "UserExistsError"
                ? "That username is already taken."
                : "Unable to create an account with those details.";
        return res.status(400).render("users/register.ejs", { error: message, returnTo });
    }

    req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        res.redirect(returnTo);
    });
}));

app.get("/login", (req, res) => {
    res.render("users/login.ejs", {
        error: req.query.error ? "Username or password is incorrect." : null,
        returnTo: safeReturnTo(req.query.returnTo || req.session.returnTo),
    });
});

app.post("/login", (req, res, next) => {
    const returnTo = safeReturnTo(req.body.returnTo || req.session.returnTo);
    passport.authenticate("local", (authError, user) => {
        if (authError) return next(authError);
        if (!user) {
            return res.status(401).render("users/login.ejs", {
                error: "Username or password is incorrect.",
                returnTo,
            });
        }

        req.logIn(user, (loginError) => {
            if (loginError) return next(loginError);
            delete req.session.returnTo;
            res.redirect(returnTo);
        });
    })(req, res, next);
});

app.post("/logout", (req, res, next) => {
    req.logout((logoutError) => {
        if (logoutError) return next(logoutError);
        res.redirect("/listings");
    });
});

//new route
app.get("/listings/new", requireLogin, (req,res)=>{
    res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id",async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", {listing});
});

app.post("/listings/:id/interest", requireLogin, wrapAsync(async (req, res) => {
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
}));

//create route
// create route
app.post("/listings", requireLogin, validateListing, wrapAsync(async (req, res,next) => {
        const listingData = req.body.listing;

    if (
        listingData.image &&
        (!listingData.image.url ||
            listingData.image.url.trim() === "")
    ) {
        delete listingData.image;
    }


    const newListing = new Listing({ ...listingData, owner: req.user._id });


    await newListing.save();

    res.redirect("/listings");
})
);

//edit route
app.get("/listings/:id/edit", requireLogin, requireListingOwner, (req,res)=>{
    res.render("listings/edit.ejs", { listing: req.listing });
});

//upadte route
app.put("/listings/:id", requireLogin, requireListingOwner, validateListing, wrapAsync(async (req,res)=>{
    const listingData = { ...req.body.listing };
    delete listingData.owner;

    if (listingData.image && (!listingData.image.url || listingData.image.url.trim() === "")) {
        delete listingData.image;
    }

    Object.assign(req.listing, listingData);
    await req.listing.save();
    res.redirect(`/listings/${req.listing._id}`);
}));

//delete route
app.delete("/listings/:id", requireLogin, requireListingOwner, wrapAsync(async (req,res)=>{
    await req.listing.deleteOne();
    res.redirect("/listings");
}));

//Reviews
//Post route for reviews
app.post("/listings/:id/reviews", validateReview , wrapAsync(async (req,res)=>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`/listings/${listing._id}`);
    console.log("Review Added!");
})
);

app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    const listing = await Listing.findOneAndUpdate(
        { _id: id, reviews: reviewId },
        { $pull: { reviews: reviewId } }
    );

    if (!listing) {
        throw new ExpressError(404, "Review not found");
    }

    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));

// app.get("/testListing", async (req,res)=>{
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description : "By the beach",
//         price:5000,
//         location: "Calangute, Goa",
//         country: "India"
//     });
//     await sampleListing.save();
//     console.log("Sample Was Saved!");
//     res.send("Successful testing");
// });

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

//Error handler
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    res.status(statusCode).render("Error.ejs",{err});
    // res.status(statusCode).send(message);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});