import { Input, Telegraf } from "telegraf";
import { Integration } from ".botpress";

const logger = console;
logger.info("starting integration");

export default new Integration({
  /** first call when init integration */
  register: async ({ webhookUrl, ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken);
    const res = await telegraf.telegram.setWebhook(webhookUrl).catch((err) => {
      console.log("error when set webhook", err);
    });
    console.log("register success", res);
  },
  unregister: async ({ ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken);
    await telegraf.telegram.deleteWebhook({ drop_pending_updates: true });
  },
  actions: {},
  channels: {
    group: {
      messages: {
        text: async ({ payload, ctx, conversation, ack }) => {
          const client = new Telegraf(ctx.configuration.botToken);
          const chat_id = Object.values(conversation.tags)[0];
          if (!chat_id) {
            throw "chat id is empty";
          }

          const message = await client.telegram.sendMessage(
            chat_id,
            payload.text
          );
          console.log("message success");

          await ack({ tags: { id: `${message.message_id}` } });
        },
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    const body = req.body;
    if (!body) {
      throw new Error("Handler didn't receive a valid body");
    }
    const data = JSON.parse(body);
    const conversationId = data?.message?.chat?.id;
    const userId = data?.message?.from?.id;
    const messageId = data?.message?.message_id;
    const text: string = (data?.message?.text || "").toLowerCase();
    const from = data?.message?.from || {};

    if (!conversationId || !userId || !messageId) {
      throw new Error("Handler didn't receive a valid message");
    }
    const newTelegraf = new Telegraf(ctx.configuration.botToken);

    newTelegraf.telegram.sendChatAction(conversationId, "typing");

    if (text === "send me image") {
      const res = await newTelegraf.telegram.sendPhoto(
        conversationId,
        Input.fromURLStream(
          "https://picsum.photos/500/500/?random",
          "randomImage.jpg"
        )
      );
      console.log("result:", res);
      return;
    }

    if (
      text.includes("hello" || "xin chào") ||
      text === "chào" ||
      text === "hi"
    ) {
      await newTelegraf.telegram.sendSticker(
        conversationId,
        STICKY_HI_ID // AgADBQADwDZPEw
      );
      newTelegraf.telegram.sendMessage(
        conversationId,
        `Hi ${from?.first_name} ${from?.last_name}, can i help you`
      );

      return;
    }
    const { conversation } = await client.getOrCreateConversation({
      channel: "group",
      tags: { id: `${conversationId}` },
    });

    const { user } = await client.getOrCreateUser({
      tags: { id: `${userId}` },
    });

    await client.createMessage({
      tags: { id: `${messageId}` },
      type: "text",
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: data.message.text },
    });
  },
});

const STICKY_HI_ID =
  "CAACAgIAAxkBAANAZNZmOMHcop8HwUuSKDykMeA7VVUAAgUAA8A2TxP5al-agmtNdTAE";
