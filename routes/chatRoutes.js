const express = require("express");
const router = express.Router();
const {
  createChatMessage,
  getChatMessagesByContext,
} = require("../controllers/chatController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, createChatMessage);

router.get("/:context_id", verifyToken, getChatMessagesByContext);

module.exports = router;
