const moment = require("moment")
const request = require('request')
const config = require("./config")

function getKnowDays() {
  const knowDay = moment('2021-10-23')
  const duration = moment.duration(moment().diff(knowDay))
  const {_data} = duration
  const {years, months, days,hours, minutes, seconds} = _data
  return `${years}年${months ? ` ${months}个月` : ''}${days ? ` ${days}天` : ''}${hours ? ` ${hours}小时` : ''}${minutes? ` ${minutes}分`: ''}${seconds ? ` ${seconds}秒` : ''}`
}

function fetch(url, options) {
  console.log(url, options)
  return new Promise(function(res, rej) {
    request(url, Object.assign({
      json: true,
      headers: {
        'Content-Type': 'application/json'
      },
      gzip: true
    }, options), function(error, response) {
      if (error) {
        console.log('接口返回错误', error)
        rej(error.toString())
      } else {
        res(response.body)
      }
    })
  })
}

async function getAccessToken () {
  const result = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.secret}`)
  console.log('getAccessToken', result)
  return result.access_token || ''
}

async function getOneSentence () {
  const result = await fetch('http://api.vvhan.com/api/love?type=json')
  if (result.success) {
    return result.ishan
  }
  return '开心快乐每一天！'
}

//获取天气
async function getweather () {
  const url= `http://v0.yiketianqi.com/api?unescape=1&version=v91&appid=43656176&appsecret=I42og6Lm&ext=&cityid=&city=${encodeURIComponent('北京')}`
  const result = await fetch(url)

  console.log('getweather', result)

  if (result && result.data && result.data.length) {
    const { wea, tem, tem1, tem2, narrative, win_speed, win } = result.data[0]
    return {
      wea,
      tem,
      temH: tem1,
      temL: tem2,
      win: Array.isArray(win) ? win.join('、') : win,
      windLevel: win_speed,
      ganmao: narrative,
    }
  }

  return {
    wea: '未知',
    tem: '未知',
    temH: '未知',
    temL: '未知',
    win: '未知',
    windLevel: '未知',
    ganmao: '无'
  }
}

async function sendTemp(token, openid)  {
  const {
    wea, tem, temH, temL, win, windLevel, ganmao
  } = await getweather()

  console.log('weather"', wea, )

  const msg = await getOneSentence()

  console.log('getOneSentence', msg)

  const result = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
    method: 'POST',
    body: {
      touser: openid,
      template_id: 'JxQnVinI7fJMPcAJktVBzPXPJqsqtAdUcHEEOy-8QIU',
      "data":{
        "knowDays": {
          "value": getKnowDays(),
          "color": "#b21c1c"
        },
        "dateTime": {
            "value": moment().format('YYYY年MM月DD日 星期dddd'),
            "color": "#d285d5"
        },
        "wea": {
            "value": wea,
            "color": "#d31e40"
        },
        "tem": {
            "value": tem,
            "color": "#d31ea5"
        },
        "temH": {
            "value": temH,
            "color": "#9621bc"
        },
        "temL": {
            "value": temL,
            "color": "#4621bc"
        },
        "win": {
          "value": win,
          "color": "#215dbc"
        },
        "windLevel": {
          "value": windLevel,
          "color": "#21bcb4"
        },
        "ganmao": {
          "value": ganmao,
          "color": "#bc4c21"
        },
        "msg": {
          "value": msg,
          "color": "#267b44"
        }
      }
    }
  })

  console.log('sendTemp', result)
}

async function sendMsg() {
  const promises = []
  const token = await getAccessToken()
  return new Promise(function(res, rej) {
    if (!token) {
      console.log('token 获取失败')
      rej('token 获取失败')
    }
    config.openids.forEach(openid => {
      promises.push(sendTemp(token, openid))
    })
    Promise.all(promises).catch(function(err){
      console.log('接口返回错误', err)
      rej(err.toString())
    }).finally(function() {
      res('执行完毕')
    })
  })
}

let timer = null
let sendCount = 0
let targetH = 12

async function sendMsgLoop() {
  await sendMsg()
  clearInterval(timer)

  timer = setInterval(function() {
    console.log('当前时间:', moment().format('YYYY-MM-DD HH:mm:ss'))
    const curH = moment().hours()
    if (sendCount < 10 && curH === targetH) {
      sendCount++
      sendMsg()
    }
    if (sendCount >= 10 || curH !== targetH) {
      sendCount = 0
    }
  }, 5 * 60 * 1000)
}

function cancelSendMsgLoop() {
  clearInterval(timer)
}

module.exports = {
  sendMsgLoop,
  cancelSendMsgLoop
}