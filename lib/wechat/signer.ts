// lib/wechat/signer.ts
import { createSign, createVerify } from 'crypto';

/**
 * 生成微信支付请求签名（用于请求头 Authorization）
 */
export function signRequest(
  method: string,
  urlPath: string,
  body: string,
  privateKey: string,
  mchid: string,
  serialNo: string
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2, 15);
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const sign = createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  return {
    authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`,
    timestamp,
    nonce,
  };
}

/**
 * 验证微信支付回调签名（使用平台证书公钥验签）
 */
export function verifySignature(
  body: string,
  timestamp: string,
  nonce: string,
  signature: string,
  platformCert: string
): boolean {
  try {
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    const verify = createVerify('RSA-SHA256');
    verify.update(message);
    verify.end();
    return verify.verify(platformCert, signature, 'base64');
  } catch (error) {
    console.error('验签失败:', error);
    return false;
  }
}