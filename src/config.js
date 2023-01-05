const defaultConfigs = {
  webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxxxxxxxxxxx',
  hostList: [
    'www.example1.com',
    'www.example2.com',
  ],
}

const configs = process.env.NODE_ENV === 'production'
  ? {
    webhook_url: process.env.WEBHOOK || defaultConfigs.webhook_url,
    hostList: process.env.HOSTS ? process.env.HOSTS.split(',').map(v => v.trim()) : defaultConfigs.hostList,
  }
  : defaultConfigs;

module.exports = configs;