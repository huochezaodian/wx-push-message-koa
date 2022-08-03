const moment = require("moment")
const request = require('request')
const config = require("./config")

function fetch(url, options) {
  return new Promise(function(res, rej) {
    request(url, Object.assign(options, {
      json: true,
      headers: {
        'content-type': 'application/json'
      }
    }), function(error, response) {
      if (error) {
        console.log('接口返回错误', error)
        rej(error.toString())
      } else {
        console.log('接口返回内容', response.body)
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
  const result= await fetch('https://vl.hitokoto.cn/')
  if (result && result.status === 200) {
    return result.data.hitokoto;
  }
  return '开心快乐每一天！'
}

//获取天气
async function getweather () {
  const url= 'http://wthrcdn.etouch.cn/weather_mini?city=北京'
  const result = await fetch(url)

  console.log('getweather', result.data)

  if (result && result.data && result.data.status === 1000) {
    const { wendu, forecast, ganmao } = result.data
    const now = forecast[0]
    return {
      wea: now.type,
      tem: wendu,
      temH: now.high.replace(/[^\d]/g, '').trim(),
      temL: now.low.replace(/[^\d]/g, '').trim(),
      win: now.fengxiang.replace(/[^\d]/g, '').trim(),
      windLevel: now.fengli.replace(/[^\d]/g, '').trim(),
      ganmao
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

  const msg = await getOneSentence()

  return fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
    method: 'POST',
    body: {
      touser: openid,
      template_id: 'LvFPgnigB04j2uPtGmoVoB4Xbgitwea2_Ivvhn-KvsU',
      "data":{
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
}

const oneDay = 24 * 60 * 60 * 1000

function sendMsg() {
  const token = getAccessToken()
  if (!token) {
    return
  }
  config.openids.forEach(openid => {
    sendTemp(token, openid)
  })
}

const timer = null

function sendMsgLoop() {
  sendMsg()
  setTimeout(sendMsg, 60 * 1000)
}

module.exports = {
  sendMsgLoop
}