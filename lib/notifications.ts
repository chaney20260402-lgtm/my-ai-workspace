export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}

/**
 * 添加一条新通知
 * @param title 通知标题
 * @param content 通知内容
 * @param type 通知类型：success / info / warning
 */
export function addNotification(
  title: string,
  content: string,
  type: 'success' | 'info' | 'warning' = 'info'
) {
  // 仅在客户端执行
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem('notifications');
  const list: Notification[] = saved ? JSON.parse(saved) : [];

  const newNotification: Notification = {
    id: Date.now().toString(),
    title,
    content,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };

  list.unshift(newNotification); // 最新通知放在最前面
  localStorage.setItem('notifications', JSON.stringify(list));
}