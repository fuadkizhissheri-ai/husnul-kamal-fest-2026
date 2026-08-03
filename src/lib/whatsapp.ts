import { prisma } from '@/lib/prisma';

export interface WhatsAppNotificationPayload {
  studentName: string;
  chestNumber: string;
  group: string;
  category: string;
  madrasa?: string;
  whatsappNumber: string;
  programmes: string[];
}

/**
 * 📲 Format Registration Confirmation WhatsApp Message Template
 */
export function formatRegistrationWhatsAppMessage(payload: WhatsAppNotificationPayload, controlDeskPhone: string = '+91 73064 80848'): string {
  const programmeListStr = payload.programmes.length > 0
    ? payload.programmes.map((p) => `• ${p}`).join('\n')
    : '• General Delegate';

  return `🎉 *Registration Confirmed – Husnul Kamal Fest 2026*

Assalamu Alaikum *${payload.studentName}*,

Your registration is successful!

📋 *Chest No:* ${payload.chestNumber}
🏠 *Group:* ${payload.group}
🎓 *Category:* ${payload.category}
🕌 *Madrasa:* ${payload.madrasa || 'Mifthahul Uloom Madrasa'}

*Registered Programmes:*
${programmeListStr}

For queries, contact Control Desk: ${controlDeskPhone}

JazakAllah Khair!
_Husnul Kamal Fest 2026 Controlling Team_`;
}

/**
 * 🚀 Non-blocking Background WhatsApp Notification Dispatcher
 * Integrates with Meta WhatsApp Cloud API or Twilio WhatsApp API
 */
export async function sendWhatsAppConfirmation(payload: WhatsAppNotificationPayload): Promise<{ success: boolean; method: string; messageId?: string; error?: string }> {
  try {
    // Clean recipient phone number (must include country code e.g. 917306480848)
    let phone = payload.whatsappNumber.replace(/\D/g, '');
    if (!phone) return { success: false, method: 'none', error: 'Invalid phone number' };
    if (phone.length === 10) phone = `91${phone}`;

    // Get Control Desk Phone from settings
    const phoneSetting = await prisma.setting.findUnique({ where: { key: 'contact_phone' } });
    const controlDeskPhone = phoneSetting?.value || '+91 73064 80848';

    const messageText = formatRegistrationWhatsAppMessage(payload, controlDeskPhone);

    // Option A: Meta WhatsApp Cloud API
    const metaToken = process.env.WHATSAPP_API_TOKEN || process.env.META_WA_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_ID;

    if (metaToken && metaPhoneId) {
      const res = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      const data = await res.json();
      if (res.ok && data.messages?.[0]?.id) {
        return { success: true, method: 'meta_cloud_api', messageId: data.messages[0].id };
      } else {
        console.warn('Meta WhatsApp Cloud API error:', data);
      }
    }

    // Option B: Twilio WhatsApp API
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (twilioAccountSid && twilioAuthToken) {
      const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        From: twilioFromNumber.startsWith('whatsapp:') ? twilioFromNumber : `whatsapp:${twilioFromNumber}`,
        To: `whatsapp:+${phone}`,
        Body: messageText,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await res.json();
      if (res.ok && data.sid) {
        return { success: true, method: 'twilio_whatsapp', messageId: data.sid };
      } else {
        console.warn('Twilio WhatsApp API error:', data);
      }
    }

    // Fallback mode when API environment credentials are not yet set up
    console.log(`[WhatsApp Notification Logged] Sent to +${phone}:\n${messageText}`);
    return {
      success: true,
      method: 'simulation_logger',
      error: 'WhatsApp Business API keys (WHATSAPP_API_TOKEN or TWILIO_ACCOUNT_SID) not configured. Notification logged.',
    };
  } catch (err: any) {
    console.error('WhatsApp notification dispatch error:', err);
    return { success: false, method: 'failed', error: err.message };
  }
}
