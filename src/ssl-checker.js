const https = require('https');
const dayjs = require('dayjs');

function calcDayDiff(checkDate, targetDate) {
  return dayjs(checkDate).diff(dayjs(targetDate), 'day');
}

const sslChecker = (host = 'www.example.com') =>
  new Promise((resolve, reject) => {
    const req = https.request({
      host,
      port: 443,
      method: 'get',
      path: '/',
    }, (res) => {
      const { subjectaltname, valid_from: validFrom, valid_to: validTo } = res.connection.getPeerCertificate();

      const baseInfo = {
        host,
        dns: subjectaltname.replace(/DNS:/g, ''),
        validFrom: dayjs(validFrom).format('YYYY-MM-DD'),
        validTo:dayjs(validTo).format('YYYY-MM-DD'),
      }
      
      const expireDay = calcDayDiff(validTo, dayjs());
      if (expireDay <= 0) {
        reject({
          message: 'expired',
          expireDay,
          ...baseInfo,
        });
      } else if (expireDay <= 7) {
        reject({
          message: 'to expire',
          expireDay,
          ...baseInfo,
        })
      }

      resolve(baseInfo);
    });

    req.on('timeout', () => {
      reject({
        message: 'timeout',
        host,
      });
      return;
    })
    req.on('error', (err) => {
      reject({
        message: err.message,
        host,
      });
    });

    req.end();
  });

module.exports = {
  sslChecker,
}