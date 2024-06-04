const asyncHandler = require("express-async-handler");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401);
            throw new Error("Please login first!");
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const userRef = admin.firestore().collection('users').doc(verified.id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(401);
            throw new Error("User not found");
        }
        req.user = userDoc.data();
        req.user.id = userDoc.id;
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Please login first!");
    }
});

module.exports = protect;
