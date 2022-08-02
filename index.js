const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
const fetch = require('node-fetch')
// const { init: initDB, Counter } = require("./db");

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

// 首页
router.get("/", async (ctx) => {
  ctx.body = homePage;
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

function sendmess (appid, mess) {
  return new Promise((resolve, reject) => {
    fetch(`http://api.weixin.qq.com/cgi-bin/message/custom/send?from_appid=${appid}`, {
      method: 'POST',
      body: JSON.stringify(mess)
    }).then((response) => {
      console.log('接口返回内容', response.body)
      resolve(response.json())
    }).catch(error => {
      console.log('接口返回错误', error)
       reject(error.toString())
    })
  })
}

router.all('/api/msg', async (ctx) => {
  const { request: req, response: res } = ctx
  console.log('消息推送', req.body)
  // 从 header 中取appid，如果 from-appid 不存在，则不是资源复用场景，可以直接传空字符串，使用环境所属账号发起云调用
  const appid = req.headers['x-wx-from-appid'] || ''
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  console.log('推送接收的账号', ToUserName, '创建时间', CreateTime)
  if (MsgType === 'text') {
    if (Content === '回复文字') { // 小程序、公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'text',
        text: {
          content: '这是回复的消息'
        }
      })
    } else if (Content === '回复图片') { // 小程序、公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'image',
        image: {
          media_id: 'P-hoCzCgrhBsrvBZIZT3jx1M08WeCCHf-th05M4nac9TQO8XmJc5uc0VloZF7XKI'
        }
      })
    } else if (Content === '回复语音') { // 仅公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'voice',
        voice: {
          media_id: '06JVovlqL4v3DJSQTwas1QPIS-nlBlnEFF-rdu03k0dA9a_z6hqel3SCvoYrPZzp'
        }
      })
    } else if (Content === '回复视频') {  // 仅公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'video',
        video: {
          media_id: 'XrfwjfAMf820PzHu9s5GYsvb3etWmR6sC6tTH2H1b3VPRDedW-4igtt6jqYSBxJ2',
          title: '微信云托管官方教程',
          description: '微信官方团队打造，贴近业务场景的实战教学'
        }
      })
    } else if (Content === '回复音乐') {  // 仅公众号可用
      await sendmess(appid, {
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
      await sendmess(appid, {
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
      await sendmess(appid, {
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

  ctx.body = {
    code: 0,
    data: 'success'
  }
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
