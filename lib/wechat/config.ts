// lib/wechat/config.ts

export const wechatPayConfig = {
  appid: process.env.WXPAY_APPID!,
  mchid: process.env.WXPAY_MCHID!,
  apiV3Key: process.env.WXPAY_API_V3_KEY!,
  privateKey: process.env.WXPAY_PRIVATE_KEY!,
  platformCert: process.env.WXPAY_PLATFORM_CERT!,
  notifyUrl: process.env.WXPAY_NOTIFY_URL!,
  serialNo: process.env.WXPAY_SERIAL_NO!, 
};