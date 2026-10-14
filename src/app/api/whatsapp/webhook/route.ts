import {
  receiveWhatsAppWebhook,
  storeWhatsAppReceipts,
  verifyWhatsAppWebhook,
} from "@/lib/whatsapp/webhook";

export function GET(request: Request) {
  return verifyWhatsAppWebhook(request, {
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  });
}

export function POST(request: Request) {
  return receiveWhatsAppWebhook(
    request,
    { appSecret: process.env.WHATSAPP_APP_SECRET },
    storeWhatsAppReceipts,
  );
}
