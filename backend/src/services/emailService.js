// src/services/emailService.js
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Email configuration from environment variables
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'Smart Garaging <noreply@smartgaraging.com>',
    enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
};

// Create transporter
let transporter = null;

if (!EMAIL_CONFIG.enabled) {
    logger.warn('⚠️  Email notifications disabled (ENABLE_EMAIL_NOTIFICATIONS != true)');
} else if (!EMAIL_CONFIG.user || EMAIL_CONFIG.user.includes('your.email')) {
    logger.warn('⚠️  Email not configured — set EMAIL_USER and EMAIL_PASSWORD in .env');
} else if (!EMAIL_CONFIG.password || EMAIL_CONFIG.password.includes('your-16')) {
    logger.warn('⚠️  Email password not set — set EMAIL_PASSWORD in .env (use Gmail App Password)');
} else {
    transporter = nodemailer.createTransport({
        service: EMAIL_CONFIG.service,
        auth: {
            user: EMAIL_CONFIG.user,
            pass: EMAIL_CONFIG.password,
        },
    });

    transporter.verify((error) => {
        if (error) {
            logger.error('❌ Email service connection failed:', error.message);
            transporter = null;
        } else {
            logger.info(`✅ Email service ready — sending as ${EMAIL_CONFIG.user}`);
        }
    });
}

/**
 * Send email notification
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    if (!EMAIL_CONFIG.enabled) {
        logger.info(`[Email] Skipped (disabled): ${subject} → ${to}`);
        return { success: false, message: 'Email service is disabled' };
    }
    if (!transporter) {
        logger.warn(`[Email] Skipped (not configured): ${subject} → ${to}`);
        return { success: false, message: 'Email transporter not ready' };
    }
    if (!to) {
        logger.warn('[Email] Skipped: recipient email is missing');
        return { success: false, message: 'Recipient email is required' };
    }

    try {
        const mailOptions = {
            from: EMAIL_CONFIG.from,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`✅ Email sent: ${subject} to ${to} (${info.messageId})`);

        return {
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully',
        };
    } catch (error) {
        logger.error(`❌ Failed to send email to ${to}:`, error.message);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Bilingual translations for common notification titles
 */
const AM_TRANSLATIONS = {
    'New Booking Request': 'አዲስ የቦታ ማስያዣ ጥያቄ',
    'Booking Submitted — Deposit Required': 'ቦታ ማስያዣ ቀርቧል — ቅድሚያ ክፍያ ያስፈልጋል',
    'Booking Confirmed': 'ቦታ ማስያዣ ተረጋግጧል',
    'Booking Rejected': 'ቦታ ማስያዣ ውድቅ ሆኗል',
    'Booking Cancelled': 'ቦታ ማስያዣ ተሰርዟል',
    'Booking Marked as No-Show': 'ቦታ ማስያዣ እንዳልቀረበ ምልክት ተደርጓል',
    'Late Arrival — Deposit Forfeited': 'ዘግይቶ መምጣት — ቅድሚያ ክፍያ ተወሰደ',
    'Deposit Paid — Review Booking': 'ቅድሚያ ክፍያ ተፈጽሟል — ቦታ ማስያዣ ይፈትሹ',
    'Deposit Confirmed': 'ቅድሚያ ክፍያ ተረጋግጧል',
    'Payment Confirmed': 'ክፍያ ተረጋግጧል',
    'Payment Successful': 'ክፍያ ተሳክቷል',
    'Payment Initiated': 'ክፍያ ተጀምሯል',
    'New Dispute Filed': 'አዲስ አቤቱታ ቀርቧል',
    'Dispute Submitted': 'አቤቱታ ቀርቧል',
    'Dispute Updated': 'አቤቱታ ተዘምኗል',
    'Garage Approved': 'ጋራዥ ፈቃድ ተሰጥቷል',
    'Garage Rejected': 'ጋራዥ ተቀባይነት አላገኘም',
    'Service Started': 'አገልግሎት ተጀምሯል',
    'Service Completed': 'አገልግሎት ተጠናቋል',
};

function getAmharicTitle(title) {
    if (!title) return '';
    if (AM_TRANSLATIONS[title]) return AM_TRANSLATIONS[title];
    for (const [en, am] of Object.entries(AM_TRANSLATIONS)) {
        if (title.startsWith(en)) return am;
    }
    return '';
}

/**
 * Send notification email
 * @param {Object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - Recipient name
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type
 * @param {string} options.actionUrl - Optional action URL
 */
export const sendNotificationEmail = async ({
    to,
    userName,
    title,
    message,
    type,
    actionUrl,
}) => {
    const amTitle = getAmharicTitle(title);
    const subject = `${getNotificationIcon(type)} ${title}${amTitle ? ` / ${amTitle}` : ''}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Smart Garaging</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">የመኪና ጋራዥ አገልግሎት ስርዓት &nbsp;|&nbsp; Your Garage Service Platform</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">Hello ${userName},</p>
                            
                            <div style="background-color: ${getNotificationColor(type)}; border-left: 4px solid ${getNotificationBorderColor(type)}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 20px;">
                                    ${getNotificationIcon(type)} ${title}
                                    ${amTitle ? `<br/><span style="font-size:16px;color:#555;">${amTitle}</span>` : ''}
                                </h2>
                                <p style="color: #666666; margin: 0; font-size: 16px; line-height: 1.6;">
                                    ${message}
                                </p>
                            </div>
                            
                            ${actionUrl ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                                    በመተግበሪያ ይመልከቱ &nbsp;/&nbsp; View in App
                                </a>
                            </div>
                            ` : ''}
                            
                            <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
                                ይህን ማሳወቂያ በዳሽቦርድዎ ላይ ማየት ይችላሉ።<br/>You can also view this notification in your dashboard by logging into the Smart Garaging platform.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} Smart Garaging System. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                ይህ ራስ-ሰር ማሳወቂያ ነው። ለዚህ ኢሜይል ምላሽ አይስጡ።<br/>This is an automated notification. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({ to, subject, html });
};

/**
 * Get notification icon emoji
 */
function getNotificationIcon(type) {
    const icons = {
        booking_new: '📅',
        booking_confirmed: '✅',
        booking_cancelled: '❌',
        payment_received: '💰',
        payment_failed: '⚠️',
        dispute_new: '🚨',
        dispute_resolved: '✅',
        garage_approved: '✅',
        garage_rejected: '❌',
        system: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
}

/**
 * Get notification background color
 */
function getNotificationColor(type) {
    const colors = {
        booking_new: '#e3f2fd',
        booking_confirmed: '#e8f5e9',
        booking_cancelled: '#ffebee',
        payment_received: '#e8f5e9',
        payment_failed: '#fff3e0',
        dispute_new: '#fff3e0',
        dispute_resolved: '#e8f5e9',
        garage_approved: '#e8f5e9',
        garage_rejected: '#ffebee',
        system: '#e3f2fd',
    };
    return colors[type] || '#f5f5f5';
}

/**
 * Get notification border color
 */
function getNotificationBorderColor(type) {
    const colors = {
        booking_new: '#2196f3',
        booking_confirmed: '#4caf50',
        booking_cancelled: '#f44336',
        payment_received: '#4caf50',
        payment_failed: '#ff9800',
        dispute_new: '#ff9800',
        dispute_resolved: '#4caf50',
        garage_approved: '#4caf50',
        garage_rejected: '#f44336',
        system: '#2196f3',
    };
    return colors[type] || '#9e9e9e';
}

export default {
    sendEmail,
    sendNotificationEmail,
};
