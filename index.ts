import { Bot } from "grammy";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const token = process.env.BOT_TOKEN || "";

const bot = new Bot(token);

const twitchClientId = process.env.CLIENT_ID || "";
const twitchClientSecret = process.env.CLIENT_SECRET || "";

async function isStreamAlive(channelName: string) {
  const url = `https://api.twitch.tv/helix/streams?user_login=kurobaaka`;
  const response = await axios.get(url, {
    headers: {
      "Client-ID": twitchClientId,
      Authorization: `Bearer ${await getTwitchToken()}`,
    },
  });
  console.log(response.data.data);
  return response.data.data.length > 0;
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

async function sendStreamAlert(chatId: string, message: string) {
  await bot.api.sendMessage(chatId, message);
}

async function checkStream(chatId: string, channelName: string) {
  if (await isStreamAlive(channelName)) {
    await sendStreamAlert(
      chatId,
      `Stream started: https://twitch.tv/${channelName}`
    );
  }
}

bot.command("start", async (ctx) => {
  const channelName = "joindev";

  setInterval(async () => {
    await checkStream(ctx.chat.id + "", channelName);
  }, 10000);
});

bot.start();
