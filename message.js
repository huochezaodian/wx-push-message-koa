const moment = require('moment')

function getTextMessage(message) {
  const { ToUserName, FromUserName, reply } = message
  const now = moment().format('YYYY-MM-DD HH:mm:ss')
  return `<xml>
  <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
  <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
  <CreateTime>${now}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${reply}]]></Content>
</xml>`
}

module.exports = {
  getTextMessage
}