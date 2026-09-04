// backend/src/services/emailService.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "Tropikit <onboarding@resend.dev>";

export async function sendReminderEmail(params: {
  to: string;
  userName?: string;
  title: string;
  category: string;
  tripId: string;
  destinationName?: string;
}): Promise<boolean> {
  const { to, userName = "Traveler", title, category, tripId, destinationName } = params;
  const appUrl = process.env.APP_URL || "https://tropikit.vercel.app";
  const actionUrl = `${appUrl}/trip/${tripId}`;

  if (!resend) {
    console.warn(`[EmailService] RESEND_API_KEY not set. Simulated email to ${to}: "${title}"`);
    return true;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6faf9; margin: 0; padding: 24px; color: #102a33;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table width="600" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #dcebe8; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background-color: #062c34; padding: 28px 32px;">
                    <span style="color: #66e0cf; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Tropikit Travel Health Reminder</span>
                    <h1 style="color: #ffffff; font-size: 20px; margin: 8px 0 0 0; font-weight: bold;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="font-size: 15px; color: #49636a; margin-top: 0;">Hello ${userName},</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #213f47;">
                      You have an upcoming milestone for your journey${destinationName ? ` to <strong>${destinationName}</strong>` : ""}:
                    </p>
                    <div style="background-color: #f2f8f7; border-left: 4px solid #087f73; padding: 14px 18px; border-radius: 8px; margin: 18px 0;">
                      <strong style="color: #087f73; font-size: 14px; text-transform: capitalize;">${category.replace(/-/g, " ")}</strong>
                      <p style="margin: 4px 0 0 0; font-size: 15px; color: #12343c;">${title}</p>
                    </div>
                    <div style="margin-top: 28px;">
                      <a href="${actionUrl}" style="background-color: #087f73; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">
                        Open Trip Preparation Hub →
                      </a>
                    </div>
                    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #eef5f4; font-size: 12px; color: #8ba0a5;">
                      <p style="margin: 0;">Tropikit provides informational travel-health support. Always consult a licensed travel doctor before departing.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Tropikit] Reminder: ${title}`,
      html: htmlContent,
    });

    if (error) {
      console.error("[EmailService] Resend API error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EmailService] Dispatch failed:", err);
    return false;
  }
}