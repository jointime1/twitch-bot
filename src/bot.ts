import { Bot } from "grammy";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const token = process.env.BOT_TOKEN || "";

export const bot = new Bot(token);

const twitchClientId = process.env.CLIENT_ID || "";
const twitchClientSecret = process.env.CLIENT_SECRET || "";

let streamStatus = false;
let messageId = -1;

let chatId = Number(process.env.CHAT_ID) || 0;

// let chatId = 931916742;
const channelName = "joindev";

async function getStreamInfo(channelName: string) {
  const url = `https://api.twitch.tv/helix/streams?user_login=${channelName}`;
  const response = await axios.get(url, {
    headers: {
      "Client-ID": twitchClientId,
      Authorization: `Bearer ${await getTwitchToken()}`,
    },
  });
  console.log(response.data.data);
  return response.data.data || [];
}

async function getTwitchToken() {
  const url = "https://id.twitch.tv/oauth2/token";
  const response = await axios.post(url, {
    client_id: twitchClientId,
    client_secret: twitchClientSecret,
    grant_type: "client_credentials",
  });

  return response.data.access_token;
}

async function sendStreamAlert(chatId: number, message: string) {
  const response = await bot.api.sendMessage(chatId, message);
  messageId = response.message_id;
  console.log(messageId);
}

async function checkStream(chatId: number, channelName: string) {
  const streamInfo = await getStreamInfo(channelName);

  if (streamInfo && streamInfo.length > 0) {
    console.log("streamInfo:", streamInfo);

    const [{ type }] = streamInfo;

    if (!streamStatus && type === "live") {
      await sendStreamAlert(
        chatId,
        `Stream started: https://twitch.tv/${channelName}`
      );
      streamStatus = true;
    }

    if (type !== "live") {
      streamStatus = false;
      await deleteMessageAlert(chatId, messageId);
    }
  } else {
    console.error("Stream info is empty or undefined");
  }
}

async function deleteMessageAlert(chatId: number, messageId: number) {
  await bot.api.deleteMessage(chatId, messageId);
}

setInterval(async () => {
  await checkStream(chatId, channelName);
}, 10000);

// bot.start();
