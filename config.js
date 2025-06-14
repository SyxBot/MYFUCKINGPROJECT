module.exports = {
  walletAddress: '0xf909a79D938A79F0D668E765736d56c3aD4b6397',
  rpcUrl: process.env.RPC_URL || '', // you set this in the Replit secret
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
};