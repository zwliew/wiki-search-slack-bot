import search from "./search";
import reply from "./slack";

// Handle any event calls to the API
async function handleEvent({ text, channel }) {
  const result = await search(text.replace(/^.+> /, ""));
  reply({
    text: result.text,
    attachments: result.attachments,
    channel
  });
}

export default {
  handleEvent
};
