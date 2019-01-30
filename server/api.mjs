import express from "express";
import axios from "axios";

const TYPES = ["url_verification", "event_callback"];
const POST_MSG_API = "https://slack.com/api/chat.postMessage";

axios.defaults.headers.common.AUTHORIZATION = `Bearer ${process.env.TOKEN}`;

const router = express.Router();

router.post("/event", (req, res) => {
  const { challenge, type, event } = req.body;

  if (!TYPES.includes(type)) return;

  if (type === TYPES[0]) {
    res.send(challenge);
    return;
  }

  const { text, channel } = event;
  const results = search(text.replace(/^.+> /, ""));
  reply({
    text: results,
    channel
  });
  res.end();
});

function search(text) {
  text = text.trim();
  return `https://sites.google.com/search/tinkertanker.com/tinkertanker-wiki?query=${text}`;
}

function reply({ text, channel }) {
  axios.post(POST_MSG_API, {
    channel,
    text
  });
  console.log(`Posted ${text} to ${channel}`);
}

export default router;
