import sortBy from 'sort-by';
import { Client, GatewayIntentBits } from 'discord.js';
import * as notion from '@notionhq/client';

const notionClient = new notion.Client({ auth: process.env.NOTION_TOKEN });

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

async function notify(message) {
  if (process.env.NODE_ENV == 'development') {
    console.log(message);
  } else {
    await discord.channels.fetch(process.env.DISCORD_CHANNEL_ID)
      .then(channel => channel.send(`\`\`\`>> Debank Portfolio\n===\n${message}\`\`\``));
  }
}

const DEBANK_API = 'https://pro-openapi.debank.com';

async function debankFetch(path) {
  return fetch(`${DEBANK_API}${path}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'AccessKey': process.env.DEBANK_KEY,
    }
  }).then(res => res.json());
}

async function totalBalance(id) {
  return debankFetch(`/v1/user/total_balance?id=${id}`)
    .then(res => {
      res.chain_list = res.chain_list
        .filter(c => c.usd_value > 0)
        .sort(sortBy('-usd_value'));
      return res;
    });
}

async function protocolBalance(id, protocolId) {
  return debankFetch(`/v1/user/protocol?id=${id}&protocol_id=${protocolId}`)
    .then(res => res.portfolio_item_list[0].stats);
}

class Row {
  constructor({ name, amount, date }) {
    this.name = name;
    this.amount = amount;
    this.date = date || new Date();
  }

  async publish() {
    if (process.env.NODE_ENV == 'development') {
      return this.print();
    } else {
      return this.publishToNotion();
    }
  }

  async print() {
    console.log(this.name, this.amount, this.date);
  }

  async publishToNotion() {
    return notionClient.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        "Name": {
          "title": [{
            "text": { "content": this.name },
          }],
        },
        "USD": {
          "number": this.amount,
        },
        "Date": {
          "date": { "start": this.date.toISOString().split('T')[0] },
        },
      },
    });
  }
}

async function main() {
  const portfolio = await totalBalance(process.env.WALLET_ADDRESS);

  const lines = [
    `Total: ${portfolio.total_usd_value.toFixed(2)} USD`,
    '',
  ];
  const row = new Row({ name: 'Total', amount: portfolio.total_usd_value });
  await row.publish();
  
  portfolio.chain_list.slice(0, 5).forEach(async (chain) => {
    lines.push(`${chain.name}: ${chain.usd_value.toFixed(2)} USD`);
    const row = new Row({ name: chain.name, amount: chain.usd_value });
    await row.publish();
  });

  console.log(lines);
  await notify(lines.join('\n'));
  
  const resolv = await protocolBalance(process.env.WALLET_ADDRESS, 'resolv');
  const resolvRow = new Row({ name: 'Resolv', amount: resolv.net_usd_value });
  await resolvRow.publish();
}

discord.once('ready', async () => {
  console.log(`Logged in as ${discord.user.tag}!`);

  // run the program code
  await main()
    .catch(e => {
      console.error(e);
      notify(e.message);
    });

  // need to do this to let the process end
  discord.destroy();
});

discord.on('error 1', console.error);

await discord.login(process.env.DISCORD_APP_TOKEN);
