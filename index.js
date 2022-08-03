const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
const sha1 = require("sha1")
const request = require("request")
const message = require("./message")
const config = require('./config')
const moment = require('moment')
// const { init: initDB, Counter } = require("./db");

const { sendMsgLoop } = require('./utils')

moment.locale('zh-cn', {
  weekdays: ['日', '一', '二', '三', '四', '五',' 六']
})

const { token } = config

const router = new Router();

// const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

// 验证微信接口
router.get("/", async (ctx) => {
  const { query, request: req } = ctx
  const { signature, timestamp, nonce, echostr } = query
  console.log(ctx.query, ctx.querystring, ctx.url)
  const str = [token, timestamp, nonce].sort().join('')
  const sha = sha1(str)

  console.log('req.body', req.body)

  sendMsgLoop()

  console.log('验证微信接口', str, sha)

  if (sha === signature) {
    ctx.body = echostr + ''
  } else {
    ctx.body = '验证失败'
  }
});



// 更新计数
// router.post("/api/count", async (ctx) => {
//   const { request } = ctx;
//   const { action } = request.body;
//   if (action === "inc") {
//     await Counter.create();
//   } else if (action === "clear") {
//     await Counter.destroy({
//       truncate: true,
//     });
//   }

//   ctx.body = {
//     code: 0,
//     data: await Counter.count(),
//   };
// });

// 获取计数
// router.get("/api/count", async (ctx) => {
//   const result = await Counter.count();

//   ctx.body = {
//     code: 0,
//     data: result,
//   };
// });

router.all('/api/msg', async (ctx) => {
  const { request: req } = ctx
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  let result = 'success'
  console.log('推送接收的账号', ToUserName, '创建时间', CreateTime)
  if (MsgType === 'text') {
    result = {
      "ToUserName": FromUserName,
      "FromUserName": ToUserName,
      "CreateTime": moment().unix(),
      "MsgType": "text",
      "Content":  Content
    }

     if (Content === '回复文本') { 
      result = message.getTextMessage({
        ToUserName,
        FromUserName,
        reply: '你好'
      })
      console.log(111, result, String(result))
    } else if (Content === '回复图片') { // 小程序、公众号可用
      result = await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'image',
        image: {
          media_id: 'P-hoCzCgrhBsrvBZIZT3jx1M08WeCCHf-th05M4nac9TQO8XmJc5uc0VloZF7XKI'
        }
      })
    } else if (Content === '回复语音') { // 仅公众号可用
      result = await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'voice',
        voice: {
          media_id: '06JVovlqL4v3DJSQTwas1QPIS-nlBlnEFF-rdu03k0dA9a_z6hqel3SCvoYrPZzp'
        }
      })
    } else if (Content === '回复视频') {  // 仅公众号可用
      result = await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'video',
        video: {
          media_id: 'XrfwjfAMf820PzHu9s5GYsvb3etWmR6sC6tTH2H1b3VPRDedW-4igtt6jqYSBxJ2',
          title: '微信云托管官方教程',
          description: '微信官方团队打造，贴近业务场景的实战教学'
        }
      })
    } else if (Content === '回复音乐') {  // 仅公众号可用
      result = await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'music',
        music: {
          title: 'Relax｜今日推荐音乐',
          description: '每日推荐一个好听的音乐，感谢收听～',
          music_url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          HQ_music_url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          thumb_media_id: 'XrfwjfAMf820PzHu9s5GYgOJbfbnoUucToD7A5HFbBM6_nU6TzR4EGkCFTTHLo0t'
        }
      })
    } else if (Content === '回复图文') {  // 小程序、公众号可用
      result = await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'link',
        link: {
          title: 'Relax｜今日推荐音乐',
          description: '每日推荐一个好听的音乐，感谢收听～',
          thumb_url: 'https://y.qq.com/music/photo_new/T002R300x300M000004NEn9X0y2W3u_1.jpg?max_age=2592000', // 支持JPG、PNG格式，较好的效果为大图360*200，小图200*200
          url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U'
        }
      })
    } else if (Content === '回复小程序') { // 仅小程序可用
      result =  await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'miniprogrampage',
        miniprogrampage: {
          title: '小程序卡片标题',
          pagepath: 'pages/index/index', // 跟 app.json 对齐，支持参数，比如pages/index/index?foo=bar
          thumb_media_id: 'XrfwjfAMf820PzHu9s5GYgOJbfbnoUucToD7A5HFbBM6_nU6TzR4EGkCFTTHLo0t'
        }
      })
    }
  }

  console.log('result', result)

  ctx.body = result
})

// 小程序调用，获取微信 Open ID
router.get("/api/wx_openid", async (ctx) => {
  if (ctx.request.headers["x-wx-source"]) {
    ctx.body = ctx.request.headers["x-wx-openid"];
  }
});

const app = new Koa();
app
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 80;
async function bootstrap() {
  // await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}
bootstrap();
