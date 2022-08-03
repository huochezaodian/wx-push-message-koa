const moment  = require('moment')

// 一天
const oneDay = 24 * 60 * 60 * 1000

function sendMessageEveryDay() {
  
}

function delay(time = 24) {
  setTimeout(() => {
    sendMessageEveryDay
  }, oneDay)
}

module.exports = {
  sendMessageEveryDay
}