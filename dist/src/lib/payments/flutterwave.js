"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePayment = initializePayment;
exports.verifyPayment = verifyPayment;
exports.initiateWithdrawal = initiateWithdrawal;
exports.getBanks = getBanks;
exports.verifyBankAccount = verifyBankAccount;
const axios_1 = require("axios");
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID || process.env.FLUTTERWAVE_PUBLIC_KEY;
const CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET || process.env.FLUTTERWAVE_SECRET_KEY;
const SECRET_KEY = CLIENT_SECRET;
async function initializePayment(data) {
    try {
        console.log('Flutterwave Debug:', {
            CLIENT_ID: CLIENT_ID ? 'Set' : 'Not set',
            CLIENT_SECRET: CLIENT_SECRET ? 'Set' : 'Not set',
            SECRET_KEY: SECRET_KEY ? 'Set' : 'Not set',
            env_vars: {
                FLUTTERWAVE_CLIENT_ID: process.env.FLUTTERWAVE_CLIENT_ID ? 'Set' : 'Not set',
                FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY ? 'Set' : 'Not set',
                FLUTTERWAVE_CLIENT_SECRET: process.env.FLUTTERWAVE_CLIENT_SECRET ? 'Set' : 'Not set',
                FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY ? 'Set' : 'Not set',
            }
        });
        if (!SECRET_KEY) {
            throw new Error('Flutterwave secret key is not configured');
        }
        const tx_ref = `ROLLEY_${Date.now()}_${data.userId}`;
        const payload = {
            tx_ref,
            amount: data.amount,
            currency: data.currency,
            redirect_url: data.redirectUrl,
            payment_options: 'card,banktransfer,ussd',
            customer: {
                email: data.email,
                name: data.email.split('@')[0],
            },
            customizations: {
                title: 'Rolley Wallet Funding',
                description: `Deposit ${data.amount} ${data.currency} to Rolley wallet`,
                logo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`,
            },
            meta: {
                userId: data.userId,
            },
            payment_plan: undefined,
        };
        const response = await axios_1.default.post(`${FLUTTERWAVE_BASE_URL}/payments`, payload, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Flutterwave API Response:', JSON.stringify(response.data, null, 2));
        if (response.data.status === 'success' && response.data.data) {
            const paymentLink = response.data.data.link;
            const paymentId = response.data.data.id;
            if (paymentLink) {
                if (paymentLink.includes('/hosted/pay/')) {
                    console.warn('⚠️  Flutterwave returned hosted checkout link - this may have script loading issues');
                }
                return {
                    status: 'success',
                    data: {
                        link: paymentLink,
                        tx_ref,
                    },
                };
            }
            else if (paymentId) {
                const standardLink = `https://checkout.flutterwave.com/v3/hosted/pay/${paymentId}`;
                console.log('Using constructed payment link:', standardLink);
                return {
                    status: 'success',
                    data: {
                        link: standardLink,
                        tx_ref,
                    },
                };
            }
            else {
                throw new Error('No payment link or ID returned from Flutterwave');
            }
        }
        else {
            console.error('Flutterwave API Error:', response.data);
            throw new Error('Invalid response from Flutterwave');
        }
    }
    catch (error) {
        console.error('Flutterwave payment initialization error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to initialize payment with Flutterwave');
    }
}
async function verifyPayment(transactionId) {
    try {
        if (!SECRET_KEY) {
            throw new Error('Flutterwave secret key is not configured');
        }
        const response = await axios_1.default.get(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Flutterwave payment verification error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
}
async function initiateWithdrawal(data) {
    try {
        if (!SECRET_KEY) {
            throw new Error('Flutterwave secret key is not configured');
        }
        const payload = {
            account_bank: data.accountBank,
            account_number: data.accountNumber,
            amount: data.amount,
            currency: data.currency,
            narration: data.narration,
            reference: data.reference,
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/webhooks/flutterwave`,
            debit_currency: data.currency,
        };
        const response = await axios_1.default.post(`${FLUTTERWAVE_BASE_URL}/transfers`, payload, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Flutterwave withdrawal error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to initiate withdrawal');
    }
}
async function getBanks(country = 'NG') {
    try {
        if (!SECRET_KEY) {
            throw new Error('Flutterwave secret key is not configured');
        }
        const response = await axios_1.default.get(`${FLUTTERWAVE_BASE_URL}/banks/${country}`, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Flutterwave get banks error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to get banks');
    }
}
async function verifyBankAccount(accountNumber, accountBank) {
    try {
        if (!SECRET_KEY) {
            throw new Error('Flutterwave secret key is not configured');
        }
        const response = await axios_1.default.post(`${FLUTTERWAVE_BASE_URL}/accounts/resolve`, {
            account_number: accountNumber,
            account_bank: accountBank,
        }, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Flutterwave account verification error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to verify bank account');
    }
}
//# sourceMappingURL=flutterwave.js.map