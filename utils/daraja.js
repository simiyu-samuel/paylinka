const axios = require('axios');

const DARAJA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return response.data.access_token;
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function getPassword(timestamp) {
  const str = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

function formatPhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('+')) p = p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

async function stkPush({ phone, amount, accountRef, description }) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const formattedPhone = formatPhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: `${process.env.APP_URL}/api/mpesa/callback`,
    AccountReference: accountRef.slice(0, 12),
    TransactionDesc: description.slice(0, 13),
  };

  const response = await axios.post(
    `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

module.exports = { stkPush, formatPhone };