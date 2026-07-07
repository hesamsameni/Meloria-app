import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM =
  process.env.EMAIL_FROM || "Meloria <notifications@meloria-app.com>";
const APP_URL = "https://meloria-app.com";
const LOGO_URL = `${APP_URL}/logo.svg`;

// ---------------------------------------------------------------------------
// Brand tokens (from main.css)
// ---------------------------------------------------------------------------
const C = {
  bg: "#faf9f7", // neutral-50  — warm page background
  card: "#ffffff", // white card
  border: "#e8e2d8", // neutral-200 — card border
  text: "#1c1a17", // neutral-900 — headings
  body: "#716250", // neutral-700 — body copy
  muted: "#a89880", // neutral-500 — footer / meta
  accent: "#E8673A", // primary-500 — ember CTA
};

// ---------------------------------------------------------------------------
// Shared base layout
// Wraps any inner HTML in the Meloria branded email shell.
// Uses table-based layout for Outlook compatibility.
// ---------------------------------------------------------------------------
function baseLayout(title, inner, footerNote = "") {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.bg};">
  <tr>
    <td align="center" style="padding:48px 16px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding-right:9px;vertical-align:middle;">
                  <img src="${LOGO_URL}" width="28" height="27" alt="" style="display:block;" />
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;font-weight:600;color:${C.text};letter-spacing:-0.2px;">Meloria</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:${C.card};border-radius:16px;border:1px solid ${C.border};padding:40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              ${inner}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
              ${footerNote}
            </p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
              &copy; ${year} Meloria &mdash; <a href="${APP_URL}/settings" style="color:${C.muted};text-decoration:underline;">Manage notifications</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------
function heading(text) {
  return `<tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:${C.text};letter-spacing:-0.3px;padding-bottom:12px;line-height:1.3;">${text}</td></tr>`;
}

function bodyText(text) {
  return `<tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:${C.body};line-height:1.7;padding-bottom:28px;">${text}</td></tr>`;
}

function ctaButton(label, url) {
  return `<tr>
    <td style="padding-bottom:4px;">
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="border-radius:10px;background-color:${C.accent};">
            <a href="${url}" style="display:block;padding:13px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.1px;">${label}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function divider() {
  return `<tr><td style="padding:8px 0 24px;"><div style="height:1px;background-color:${C.border};"></div></td></tr>`;
}

// ---------------------------------------------------------------------------
// Notification templates
// ---------------------------------------------------------------------------
const TEMPLATES = {
  taste_profile_updated: {
    subject: "Your taste profile was updated",
    html: () =>
      baseLayout(
        "Your taste profile was updated",
        heading("Your taste profile was updated") +
          bodyText(
            "Meloria has refreshed your taste profile based on your latest captures. " +
              "Your suggestions are now even more tailored to what you love.",
          ) +
          ctaButton("View your suggestions →", `${APP_URL}/dashboard`),
        "You're receiving this because email notifications are enabled on your account.",
      ),
  },

  suggestions_ready: {
    subject: "Fresh suggestions are ready for you",
    html: () =>
      baseLayout(
        "Fresh suggestions are ready",
        heading("Fresh suggestions are ready") +
          bodyText(
            "We've picked new movies, books, and music based on your latest taste profile. " +
              "Open Meloria to explore what we found for you.",
          ) +
          ctaButton("See your suggestions →", `${APP_URL}/dashboard`),
        "You're receiving this because email notifications are enabled on your account.",
      ),
  },
};

/**
 * Send a notification email to a single address for a given event type.
 * Silently swallows errors so email never breaks the main flow.
 */
export async function sendNotificationEmail(to, eventType) {
  const template = TEMPLATES[eventType];
  if (!template) {
    console.warn(`[EmailNotify] No template for event type: ${eventType}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: template.subject,
      html: template.html(),
    });
  } catch (e) {
    console.error(
      `[EmailNotify] Failed to send ${eventType} to ${to}:`,
      e.message,
    );
  }
}
