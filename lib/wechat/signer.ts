// lib/wechat/signer.ts
import { createSign, createVerify } from 'crypto';

export function signRequest(
  method: string,
  urlPath: string,
  body: string,
  privateKey: string,
  mchid: string
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2, 15);
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const sign = createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  return {
    authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="",signature="${signature}"`,
    timestamp,
    nonce,
  };
}

/**
 * 验证微信支付回调签名（平台证书验签）
 */
export function verifySignature(
  body: string,
  timestamp: string,
  nonce: string,
  signature: string,
  platformCert: string
): boolean {
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verify = createVerify('RSA-SHA256');
  verify.update(message);
  verify.end();
  return verify.verify(platformCert, signature, 'base64');
}