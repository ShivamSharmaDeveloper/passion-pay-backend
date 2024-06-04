const asyncHandler = require("express-async-handler");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id, time) => {
    return jwt.sign({ id }, 'shhhhh', { expiresIn: time });
};

// Register
const registerUser = asyncHandler(async (req, res) => {
    const { name, userName, email, password, gender } = req.body;

    // Validation
    if (!name || !userName || !email || !password || !gender) {
        res.status(400);
        throw new Error("You logged in incomplete or incorrectly!");
    }
    if (password.length < 6 || password.length > 23) {
        res.status(400);
        throw new Error("Password must be between 6 and 23 characters");
    }

    const db = admin.firestore();
    const emailUsed = await db.collection('users').where('email', '==', email).get();
    const userNameUsed = await db.collection('users').where('userName', '==', userName).get();

    if (!emailUsed.empty || !userNameUsed.empty) {
        res.status(400);
        throw new Error("The information entered has been used before");
    }

    // Encrypt password before sending to DB server
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const userRef = db.collection('users').doc();
    const newUser = {
        name,
        userName,
        email,
        password: hashedPassword,
        gender,
        privateAccount: false,
        ppLink: "default_pp.png",
        bio: "",
        followersId: [],
        followingId: [],
        messagingUsers: [],
        followingRequest: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);

    const token = generateToken(userRef.id, "2w");
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7 * 2)),
        sameSite: "none",
        secure: true
    });

    if (userRef) {
        res.status(201).json({ ...newUser, _id: userRef.id, token });
    } else {
        res.status(400);
        throw new Error("Invalid user data!");
    }
});

// Login
const loginUser = asyncHandler(async (req, res) => {
    const { userName, password } = req.body;
    if (!userName || !password) {
        res.status(400);
        throw new Error("You logged in incomplete or incorrectly!");
    }

    const db = admin.firestore();
    const userSnapshot = await db.collection('users').where('userName', '==', userName).get();
    if (userSnapshot.empty) {
        res.status(400);
        throw new Error("Username not used!");
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    const token = generateToken(userDoc.id, "1d");
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24)),
        sameSite: "none",
        secure: true
    });

    if (passwordIsCorrect) {
        res.status(200).json({ ...user, _id: userDoc.id, token });
    } else {
        res.status(400);
        throw new Error("Invalid user data!");
    }
});

// Logout
const logout = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true
    });
    return res.status(200).json({ message: "Logged out!" });
});

// Get User
const getUser = asyncHandler(async (req, res) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(req.user.id);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        const user = userDoc.data();
        res.status(200).json({ ...user, _id: userDoc.id });
    } else {
        res.status(400);
        throw new Error("User not found");
    }
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json(false);
    }
    const verified = jwt.verify(token, 'shhhhh');
    if (verified) {
        return res.json(true);
    }
    return res.json(false);
});

// Get Basic Info
const getBasicInfo = asyncHandler(async (req, res) => {
    const { userName } = req.body;
    const db = admin.firestore();
    const userSnapshot = await db.collection('users').where('userName', '==', userName).get();

    if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();
        if (user.privateAccount) {
            res.status(200).json({
                _id: userDoc.id,
                name: user.name,
                userName: user.userName,
                gender: user.gender,
                privateAccount: user.privateAccount,
                ppLink: user.ppLink,
                bio: user.bio
            });
        } else {
            res.status(200).json({
                _id: userDoc.id,
                name: user.name,
                userName: user.userName,
                gender: user.gender,
                privateAccount: user.privateAccount,
                ppLink: user.ppLink,
                bio: user.bio,
                followersId: user.followersId,
                followingId: user.followingId
            });
        }
    } else {
        res.status(400);
        throw new Error("User not found");
    }
});

// Search User
const searchUser = asyncHandler(async (req, res) => {
    const { userName } = req.body;
    if (userName.length >= 1) {
        const db = admin.firestore();
        const userSnapshot = await db.collection('users')
            .where('userName', '>=', userName)
            .where('userName', '<=', userName + '\uf8ff')
            .limit(6)
            .get();

        if (!userSnapshot.empty) {
            const userNames = userSnapshot.docs.map(doc => {
                const user = doc.data();
                return {
                    name: user.name,
                    userName: user.userName,
                    ppLink: user.ppLink
                };
            });
            res.status(200).json(userNames);
        } else {
            res.status(200).json([]);
        }
    } else {
        res.status(200).json([]);
    }
});

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    getBasicInfo,
    searchUser
};
