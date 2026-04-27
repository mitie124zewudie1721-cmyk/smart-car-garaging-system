// src/services/smsService.js
import logger from '../utils/logger.js';

const SMS_CONFIG = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
    from: process.env.AT_SENDER_ID || 'SmartGarage',
    enabled: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
};

let smsClient = null;

// Lazy-initialize Africa's Talking client
const getClient = async () => {
    if (smsClient) return smsClient;
    if (!SMS_CONFIG.enabled || !SMS_CONFIG.apiKey || !SMS_CONFIG.username) return null;
    try {
        const AfricasTalking = (await import('africastalking')).default;
        const at = AfricasTalking({ apiKey: SMS_CONFIG.apiKey, username: SMS_CONFIG.username });
        smsClient = at.SMS;
        logger.info('✅ SMS service (Africa\'s Talking) initialized');
        return smsClient;
    } catch (err) {
        logger.error('❌ Failed to initialize SMS service:', err.message);
        return null;
    }
};

/**
 * Normalize phone number to E.164 format for Ethiopia (+251...)
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    // Ethiopian numbers: 09XXXXXXXX → +2519XXXXXXXX
    if (digits.startsWith('09') && digits.length === 10) return '+251' + digits.slice(1);
    if (digits.startsWith('251') && digits.length === 12) return '+' + digits;
    if (digits.startsWith('+251')) return phone;
    // Already has country code
    if (digits.length >= 11) return '+' + digits;
    return null;
};

/**
 * Send SMS to a single recipient
 * @param {string} to - Phone number
 * @param {string} message - SMS text (max 160 chars)
 */
export const sendSMS = async (to, message) => {
    const client = await getClient();
    if (!client) {
        logger.info(`SMS not sent (service disabled): "${message.slice(0, 30)}..." to ${to}`);
        return { success: false, message: 'SMS service is disabled' };
    }

    const phone = normalizePhone(to);
    if (!phone) {
        logger.warn(`Cannot send SMS: invalid phone number "${to}"`);
        return { success: false, message: 'Invalid phone number' };
    }

    try {
        const result = await client.send({
            to: [phone],
            message: message.slice(0, 160), // SMS limit
            from: SMS_CONFIG.from,
        });
        const recipient = result.SMSMessageData?.Recipients?.[0];
        if (recipient?.status === 'Success') {
            logger.info(`✅ SMS sent to ${phone}: "${message.slice(0, 40)}..."`);
            return { success: true, messageId: recipient.messageId };
        } else {
            logger.warn(`⚠️ SMS to ${phone} status: ${recipient?.status}`);
            return { success: false, message: recipient?.status };
        }
    } catch (err) {
        logger.error(`❌ SMS failed to ${phone}:`, err.message);
        return { success: false, message: err.message };
    }
};

/**
 * Send notification SMS — formats message from title + body
 */
export const sendNotificationSMS = async (phone, title, message) => {
    const text = `[Smart Garaging] ${title}: ${message}`.slice(0, 160);
    return sendSMS(phone, text);
};

export default { sendSMS, sendNotificationSMS };
