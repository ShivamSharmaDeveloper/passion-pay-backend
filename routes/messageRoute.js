const express = require("express");
const router = express.Router();
const { sendMessage, getMessagesById } = require("../controllers/messageController");
const protect = require("../middleWares/authMiddleware");
const linkUsers = require("../middleWares/messagingMiddleware");

router.post("/sendMessage", protect, linkUsers, sendMessage);
router.get("/getMessages/:id", protect, getMessagesById);

module.exports = router;
