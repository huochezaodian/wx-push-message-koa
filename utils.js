const moment = require("moment")
const request = require('request')
const cheerio = require('cheerio')
const config = require("./config")

function getKnowDays() {
  const cur = moment().format('YYYY-MM-DD')
  const knowDay = moment('2021-10-23')
  return moment().diff(knowDay, 'd')
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
  const result = await fetch('http://wufazhuce.com/')
  if (result) {
    const $ = cheerio.load(result.toString())
    const everyDayWordsList = []
    $('div .fp-one-cita a').each(function(){
      if($(this).text()){
        everyDayWordsList.push($(this).text().trim())
      }  
    })
    console.log('everyDayWordsList', everyDayWordsList)
    return everyDayWordsList[0] || '开心快乐每一天！'
  }
  return '开心快乐每一天！'
}

//获取天气
async function getweather () {
  const url= `http://wthrcdn.etouch.cn/weather_mini?city=${encodeURIComponent('北京')}`
  const result = await fetch(url)

  console.log('getweather', result)

  if (result && result.data && result.status === 1000) {
    const { wendu, forecast, ganmao } = result.data
    const now = forecast[0]
    return {
      wea: now.type,
      tem: wendu,
      temH: now.high.replace(/[^\d]/g, '').trim(),
      temL: now.low.replace(/[^\d]/g, '').trim(),
      win: now.fengxiang,
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

  console.log('getOneSentence', msg)

  const result = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
    method: 'POST',
    body: {
      touser: openid,
      template_id: 'YvNnyS8dTZVBs2tR0SYRtb1kJOjOO0EQvOV9_3xZ42k',
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

const oneDay = 24 * 60 * 60 * 1000

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

async function sendMsgLoop() {
  await sendMsg()
  clearInterval(timer)

  // 首次距离明天8点时间
  const diff = moment(moment().add(1, 'days').format('YYYY-MM-DD 8:00:00')).diff(moment(), "millisecond")

  setTimeout(function() {
    timer = setInterval(sendMsg, oneDay)
  }, diff)
}

function cancelSendMsgLoop() {
  clearInterval(timer)
}

module.exports = {
  sendMsgLoop,
  cancelSendMsgLoop
}