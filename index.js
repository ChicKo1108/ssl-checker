const { hostList } = require('./src/config');
const { sslChecker } = require('./src/ssl-checker');
const { sendNotice } = require('./src/webhook');

function checkSSL(host, tryTime) {
  sslChecker(host).catch(err => {
    if (err.message === 'expired') {
      // 证书已经过期
      sendNotice('域名证书已过期，请及时更换', [
        `**域名：**${err.host}`,
        `**dns：** ${err.dns}`,
        `**证书申请日期：**${err.validFrom}`,
        `**证书过期日期：**${err.validTo}`,
        `**过期天数：**${-err.expireDay}天`,
      ]);
    } else if (err.message === 'to expire') {
      // 证书即将过期，在第 7 / 3 / 1 天进行飞书提醒
      if ([7, 3, 1].includes(err.expireDay)) {
        sendNotice('域名证书即将过期，请及时更换', [
          `**域名：**${err.host}`,
          `**dns：** ${err.dns}`,
          `**证书申请日期：**${err.validFrom}`,
          `**证书过期日期：**${err.validTo}`,
          `**剩余天数：**${err.expireDay}天`,
        ]);
      }
    } else if (err.message === 'timeout') {
      // 失败重试
      if (tryTime > 0) {
        checkSSL(host, --tryTime);
      } else {
        sendNotice('域名证书过期时间检查失败，查询超时', [
          `**域名：**${err.host}`,
          ``,
          `---此消息通知来自于**ssl-checker**代码库`,
        ]);
      }
    } else {
      // 未知错误
      sendNotice('域名证书过期时间检查失败', [
        `**域名：**${err.host}`,
        `**错误信息：**${err.message}`,
        ``,
        `---此消息通知来自于**ssl-checker**代码库`,
      ]);
    }
  });
}

hostList.forEach(host => {
  checkSSL(host, 3);
});