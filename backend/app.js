const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const listingRoutes = require("./routes/listingRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const bookingRoutes = require("./routes/bookingRoutes.js");
const { requireLogin } = require("./middleware/auth.js");
const { notFound, errorHandler } = require("./middleware/errorHandler.js");
const { processDueFollowUps } = require("./services/bookingFollowUp.js");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoUrl = process.env.ATLASDB_URL || process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
if (!mongoUrl) throw new Error("ATLASDB_URL or MONGODB_URI must be configured.");
if (!sessionSecret) throw new Error("SESSION_SECRET must be configured.");
const app = express();

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(session({
    store: MongoStore.create({ mongoUrl, touchAfter: 24 * 60 * 60 }),
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
    res.locals.searchQuery = typeof req.query.q === "string" ? req.query.q : "";
    next();
});

app.get("/", (req, res) => res.redirect("/listings"));
app.use("/listings", listingRoutes);
app.use("/bookings", requireLogin, bookingRoutes);
app.use("/", userRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 8080;
mongoose.connect(mongoUrl)
    .then(() => {
        console.log("connected to DB");
        app.listen(port, () => console.log(`server is listening to port ${port}`));
        processDueFollowUps();
        const followUpInterval = setInterval(processDueFollowUps, 15 * 60 * 1000);
        followUpInterval.unref();
    })
    .catch((error) => {
        console.error("Unable to connect to the database:", error);
        process.exitCode = 1;
    });