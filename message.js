const moment = require('moment')

function getTextMessage(message) {
  const { ToUserName, FromUserName, reply } = message
  return {
    "ToUserName": FromUserName,
    "FromUserName": ToUserName,
    "CreateTime": moment().unix(),
    "MsgType": "text",
    "Content":  reply
  }
}

module.exports = {
  getTextMessage
}