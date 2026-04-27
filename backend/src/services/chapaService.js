// src/services/chapaService.js
import axios from 'axios';
import logger from '../utils/logger.js';

const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE = 'https://api.chapa.co/v1';

/**
 * Initialize a Chapa payment — returns checkout URL
 */
export async function initializeChapaPayment({ amount, currency = 'ETB', email, firstName, lastName, txRef, callbackUrl, returnUrl, customization = {} }) {
    try {
        const res = await axios.post(`${CHAPA_BASE}/transaction/initialize`, {
            amount: String(amount),
            currency,
            email,
            first_name: firstName,
            last_name: lastName,
            tx_ref: txRef,
            callback_url: callbackUrl,
            return_url: returnUrl,
            'customization[title]': customization.title || 'Smart Garaging Payment',
            'customization[description]': customization.description || 'Garage service payment',
        }, {
            headers: { Authorization: `Bearer ${CHAPA_SECRET}`, 'Content-Type': 'application/json' },
        });

        return { success: true, checkoutUrl: res.data.data.checkout_url, txRef };
    } catch (err) {
        logger.error('Chapa init failed:', err.response?.data || err.message);
        const errData = err.response?.data;
        logger.error('Chapa full error response:', JSON.stringify(errData));
        const errMsg = typeof errData?.message === 'object'
            ? JSON.stringify(errData.message)
            : (errData?.message || err.message || 'Payment initialization failed');
        return { success: false, message: errMsg };
    }
}

/**
 * Verify a Chapa transaction
 */
export async function verifyChapaTransaction(txRef) {
    try {
        const res = await axios.get(`${CHAPA_BASE}/transaction/verify/${txRef}`, {
            headers: { Authorization: `Bearer ${CHAPA_SECRET}` },
        });
        const data = res.data.data;
        return {
            success: true,
            status: data.status, // 'success' | 'failed' | 'pending'
            amount: parseFloat(data.amount),
            currency: data.currency,
            txRef: data.tx_ref,
            chapaRef: data.chapa_transfer_id,
            paymentMethod: data.payment_type || data.method || 'chapa', // actual method used (mpesa, telebirr, etc.)
        };
    } catch (err) {
        logger.error('Chapa verify failed:', err.response?.data || err.message);
        return { success: false, message: 'Verification failed' };
    }
}

/**
 * Transfer money to a bank account (for withdrawals)
 * Requires Chapa Transfer API access
 */
export async function chapaBankTransfer({ accountName, accountNumber, bankCode, amount, reference, reason }) {
    try {
        const res = await axios.post(`${CHAPA_BASE}/transfers`, {
            account_name: accountName,
            account_number: accountNumber,
            amount: String(amount),
            currency: 'ETB',
            reference,
            bank_code: bankCode,
            reason: reason || 'Garage earnings withdrawal',
        }, {
            headers: { Authorization: `Bearer ${CHAPA_SECRET}`, 'Content-Type': 'application/json' },
        });
        return { success: true, transferId: res.data.data?.id };
    } catch (err) {
        logger.error('Chapa transfer failed:', err.response?.data || err.message);
        return { success: false, message: err.response?.data?.message || 'Transfer failed' };
    }
}

export default { initializeChapaPayment, verifyChapaTransaction, chapaBankTransfer };
