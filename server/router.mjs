import express from "express";
import handle from "./handler";

const TYPES = ["url_verification", "event_callback"];

const router = express.Router();

// Allow POST requests to the /event api
router.post("/event", async (req, res) => {
  const { challenge, type, event } = req.body;

  // Only permit URL verification and event callbacks
  if (!TYPES.includes(type)) {
    res.status(400).end();
    return;
  }

  // For URL verifications, simply respond with the challenge param
  if (type === TYPES[0]) {
    res.send(challenge);
    return;
  }

  // Otherwise, pass the event to the event handler
  handle(event);

  res.status(202).end();
});

export default router;
