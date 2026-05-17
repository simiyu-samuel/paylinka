const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { stkPush } = require('../utils/daraja');
const { run, get } = require('../db/database');

router.post('/pay', async (req, res) => {
  try {
    const { link_id, phone, payer_name } = req.body;

    if (!link_id || !phone) {
      return res.status(400).json({ error: 'Link ID and phone are required' });
    }

    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Enter a valid Safaricom number' });
    }

    const link = await get(
      'SELECT * FROM payment_links WHERE id = ? AND is_active = 1',
      [link_id]
    );
    if (!link) return res.status(404).json({ error: 'Payment link not found or inactive' });

    const totalAmount = link.amount + link.fee;
    const paymentId = nanoid(16);

    await run(
      `INSERT INTO payments (id, link_id, payer_name, payer_phone, amount, fee, net_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [paymentId, link_id, payer_name?.trim() || 'Anonymous', phone.trim(), totalAmount, link.fee, link.amount]
    );

    const stkResult = await stkPush({
      phone,
      amount: totalAmount,
      accountRef: link_id,
      description: link.title,
    });

    if (stkResult.ResponseCode !== '0') {
      await run('UPDATE payments SET status = ? WHERE id = ?', ['failed', paymentId]);
      return res.status(400).json({ error: stkResult.ResponseDescription || 'STK push failed' });
    }

    await run(
      'UPDATE payments SET checkout_request_id = ? WHERE id = ?',
      [stkResult.CheckoutRequestID, paymentId]
    );

    res.json({
      success: true,
      payment_id: paymentId,
      message: 'Check your phone and enter your M-Pesa PIN',
      checkout_request_id: stkResult.CheckoutRequestID,
    });
  } catch (err) {
    console.error('STK push error:', err?.response?.data || err.message);
    const msg = err?.response?.data?.errorMessage || 'Payment initiation failed. Try again.';
    res.status(500).json({ error: msg });
  }
});

router.post('/callback', async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const checkoutId = body.CheckoutRequestID;
    const resultCode = body.ResultCode;

    if (resultCode === 0) {
      const items = body.CallbackMetadata?.Item || [];
      const getMeta = (name) => items.find(i => i.Name === name)?.Value;

      const mpesaReceipt = getMeta('MpesaReceiptNumber');
      const amount = getMeta('Amount');
      const phone = getMeta('PhoneNumber');

      await run(
        `UPDATE payments SET 
          status = 'success', 
          mpesa_receipt = ?, 
          paid_at = CURRENT_TIMESTAMP
         WHERE checkout_request_id = ?`,
        [mpesaReceipt, checkoutId]
      );

      console.log(`Payment success: ${mpesaReceipt} - KES ${amount} from ${phone}`);
    } else {
      await run(
        "UPDATE payments SET status = 'failed' WHERE checkout_request_id = ?",
        [checkoutId]
      );
      console.log(`Payment failed: ${body.ResultDesc}`);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

module.exports = router;