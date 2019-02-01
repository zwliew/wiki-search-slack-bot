import axios from "axios";

const POST_MSG_API = "https://slack.com/api/chat.postMessage";

axios.defaults.headers.common.AUTHORIZATION = `Bearer ${process.env.TOKEN}`;

function reply({ text, attachments, channel }) {
  axios.post(POST_MSG_API, {
    channel,
    text,
    attachments
  });
}

export default reply;
