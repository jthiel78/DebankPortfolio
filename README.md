This is code I found in resolv discord, should update



# DebankPortfolio ultimate

I'm sick of refreshing the Debank site every morning to see how things look.

Instead, it'd be cool if computers could do that for me and ping me in Discord about it.

So that's what this computer program does. Intended to be a scheduled deployment in Replit that runs every morning before I wake up, so I've got the message waiting for me at the same time every day.

It shows me the total balance as well as the top five chains I'm using.

These secrets must be set:

- `WALLET_ADDRESS`
- `DEBANK_KEY`
- `DISCORD_CHANNEL_ID`
- `DISCORD_APP_TOKEN`

You need to get the `DEBANK_KEY` for your Debank Cloud account. It's not a free API, but one million compute units cost me 200 USDC. They charge using Coinbase Commerce, and I paid with a bit of ETH I had sitting in Base, and it was instantaneous and the fee was $0.002826 ... amazing.

You need to set up a Discord channel to send the messages to. That's free, but figuring it out is on you.
