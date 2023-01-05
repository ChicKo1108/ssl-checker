# ssl-checker
定期检查域名证书

> 掘金文章：https://juejin.cn/post/7185014893400047674

### 证书信息获取

通过node的`tls`模块的`tlsScoket.getPeerCertificate()`方法获取证书信息。使用`https.request()`方法向待检查的域发送请求，在回调函数中调用上述方法即可。如下例所示：

> 注：`res.connection`对象在`node v16.0`版本以后移除，可尝试直接使用`tls.connect()`方法。

```js
const opts = {
    host: 'www.example.com',
    port: 443,
    method: 'get',
}

const req = https.request(opts, (res) => {
    // 通过getPeerCertificate()方法可以获取到证书的相关信息。
    /**
    * subjectalname: 主体信息，格式为 DNS:*.expample.com, DNS:www.example.com
    * valid_from: 证书申请日期
    * valid_to: 证书失效日期
    **/
    const { subjectaltname, valid_from, valid_to } = res.connection.getPeerCertificate();
    
    // TODO: 验证证书信息，发送告警信息...
});

req.end();
```

### 定期检查

通过部署`k8s CronJob`，实现定期执行脚本检查证书是否过期。


#### 1. 发布docker镜像

要部署CronJob首先要把代码打包成docker镜像。


```bash
# dockerfile

FROM node:14 # 这里锁一个小于16的版本

WORKDIR /app
COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .
```

```bash
# deploy.sh
docker build -t ssh-checker .
docker push ssh-checker
```

#### 2. 创建CronJob

CronJob是基于时间调度的job，CronJob的基本格式如下：

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: ssl-checker
spec:
  schedule: 0 0 * * *  # 时间调度
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ssl-checker
            image: ssl-checker # 换成镜像源
            imagePullPolicy: IfNotPresent
            command:
              - node
              - index.js
            env:
            - name: NODE_ENV
              value: production
            - name: TZ
              value: Asia/Shanghai
            - name: HOSTS
              value: www.example1.com, www.example2.com # index.js中读取了环境变量作为参数
            
          restartPolicy: OnFailure
```

CronJob中的`schedule`是一个执行该任务的时间表，其语法如下：

```
    *          *           *               *           *
分（0-59）  时（0-59）  月的某天（1-31）  月（1-12）  周的某天（0-6）
```

举例说明：

- 0 8 * * *：每天8点执行
- 20-40 8 * * *：每天8点20-8点40执行
- 20-40/2 8 * * *：每天8点20-8点40，每隔2分钟执行一次
- 20,40 8 * * *：每天8点20和8点40执行

> 在线cron表达式解析网站：https://crontab.guru/

### 告警通知

通过飞书通知发送告警。
