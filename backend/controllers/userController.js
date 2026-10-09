const passport = require("passport");
const User = require("../models/user.js");
const { registerSchema } = require("../schema.js");
const { safeReturnTo } = require("../middleware/auth.js");

exports.registerForm = (req, res) => {
    res.render("users/register.ejs", {
        error: null,
        returnTo: safeReturnTo(req.query.returnTo),
    });
};

exports.register = async (req, res, next) => {
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
};

exports.loginForm = (req, res) => {
    res.render("users/login.ejs", {
        error: req.query.error ? "Username or password is incorrect." : null,
        returnTo: safeReturnTo(req.query.returnTo || req.session.returnTo),
    });
};

exports.login = (req, res, next) => {
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
};

exports.logout = (req, res, next) => {
    req.logout((logoutError) => {
        if (logoutError) return next(logoutError);
        res.redirect("/listings");
    });
};