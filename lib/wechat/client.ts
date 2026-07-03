// lib/wechat/client.ts
import { signRequest } from './signer';
import { wechatPayConfig } from './config';

const WECHAT_PAY_API = 'https://api.mch.weixin.qq.com';

export async function wechatRequest(
  method: string,
  path: string,
  body?: any
) {
  const url = `${WECHAT_PAY_API}${path}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  const { authorization } = signRequest(
    method,
    path,
    bodyStr,
    wechatPayConfig.privateKey,
    wechatPayConfig.mchid
  );

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Aguala/1.0',
      'Authorization': authorization,
    },
    body: bodyStr || undefined,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`微信支付 API 请求失败: ${response.status} - ${errorData}`);
  }
  return response.json();
}