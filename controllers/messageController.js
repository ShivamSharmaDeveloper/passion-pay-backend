const asyncHandler = require("express-async-handler");
const admin = require("firebase-admin");

// Send Message
const sendMessage = asyncHandler(async (req, res) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(req.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        res.status(400);
        throw new Error("User not found!");
    }

    const { text } = req.body;
    const messagingRef = db.collection('messages').doc(req.messagingId);
    await messagingRef.update({
        messages: admin.firestore.FieldValue.arrayUnion({
            senderId: req.user.id,
            text: text,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    });

    res.status(201).json({ message: text });
});

// Get Messages by ID
const getMessagesById = asyncHandler(async (req, res) => {
    const db = admin.firestore();
    const messagingRef = db.collection('messages').doc(req.messagingId);
    const messagingDoc = await messagingRef.get();

    if (messagingDoc.exists) {
        const { messages } = messagingDoc.data();
        res.status(200).json({ messages });
    } else {
        res.status(400);
        throw new Error("An error occurred while connecting to the server");
    }
});

module.exports = {
    sendMessage,
    getMessagesById,
};
