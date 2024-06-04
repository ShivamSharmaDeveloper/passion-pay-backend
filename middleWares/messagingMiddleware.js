const asyncHandler = require("express-async-handler");
const admin = require("firebase-admin");

const linkUsers = asyncHandler(async (req, res, next) => {
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(req.user.id);
        const userDoc = await userRef.get();
        const { otherUserName } = req.body;
        const otherUserSnapshot = await db.collection('users').where('userName', '==', otherUserName).get();

        if (userDoc.exists && !otherUserSnapshot.empty) {
            const otherUserDoc = otherUserSnapshot.docs[0];
            const otherUserRef = otherUserDoc.ref;

            const checkLinkedSnapshot = await db.collection('messages')
                .where('ownersId', 'array-contains', req.user.id)
                .where('ownersId', 'array-contains', otherUserDoc.id)
                .get();

            if (checkLinkedSnapshot.empty) {
                const messagingRef = db.collection('messages').doc();
                await messagingRef.set({
                    ownersId: [req.user.id, otherUserDoc.id],
                    messages: [],
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                await userRef.update({
                    messagingUsers: admin.firestore.FieldValue.arrayUnion(otherUserDoc.id)
                });

                await otherUserRef.update({
                    messagingUsers: admin.firestore.FieldValue.arrayUnion(req.user.id)
                });

                req.messagingId = messagingRef.id;
            } else {
                req.messagingId = checkLinkedSnapshot.docs[0].id;
            }
            next();
        } else {
            res.status(401);
            throw new Error("Users not found!");
        }
    } catch (error) {
        res.status(401);
        throw new Error("You made an unauthorized request");
    }
});

module.exports = linkUsers;
