const axios = require('axios');
const { webhook_url } = require('./config');

module.exports = {
  sendNotice(title = '', texts = []) {
    return axios.post(webhook_url, {
      msg_type: 'interactive',
      card: {
        elements: [{
          tag: 'div',
          text: {
            content: texts.join('\n'),
            tag: 'lark_md'
          }
        }],
        header: {
          title: {
            content: title,
            tag: 'plain_text'
          }
        }
      }
    })
  }
}