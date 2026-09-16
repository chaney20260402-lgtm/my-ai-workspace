import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faqs = [
    { question: '退货政策是什么', answer: '我们支持7天无理由退货，商品需保持完好，运费由买家承担。', category: '退货' },
    { question: '发货需要多久', answer: '付款后48小时内发货，物流时间根据目的地3-15天不等。', category: '物流' },
    { question: '支持哪些支付方式', answer: '支持信用卡、PayPal、微信支付、支付宝。', category: '支付' },
    { question: '如何查询订单', answer: '登录后在"我的订单"页面可查看订单状态和物流信息。', category: '订单' },
    { question: '商品有质量问题怎么办', answer: '请在收到货7天内联系客服，提供照片，我们会安排补发或退款。', category: '售后' },
  ];

  for (const faq of faqs) {
    await prisma.knowledgeBase.create({ data: faq });
  }

  console.log(`已录入 ${faqs.length} 条知识库`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });