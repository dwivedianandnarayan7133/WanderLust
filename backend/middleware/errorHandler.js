const ExpressError = require("../utils/ExpressError.js");

exports.notFound = (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
};

exports.errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).render("Error.ejs", { err });
};