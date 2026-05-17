const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { run, get, all } = require('../db/database');

const FEE_FLAT = parseFloat(process.env.FEE_FLAT || '3');

router.post('/create', async (req, res) => {
  try {
    const { creator_name, title, description, amount } = req.body;

    if (!creator_name || !title || !amount) {
      return res.status(400).json({ error: 'Name, title and amount are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      return res.status(400).json({ error: 'Amount must be at least Ksh 10' });
    }

    const id = nanoid(10);
    const secret_token = nanoid(32);

    await run(
      `INSERT INTO payment_links (id, creator_name, title, description, amount, fee, secret_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, creator_name.trim(), title.trim(), description?.trim() || '', parsedAmount, FEE_FLAT, secret_token]
    );

    res.json({
      success: true,
      link_id: id,
      secret_token,
      pay_url: `${process.env.APP_URL}/pay/${id}`,
      dashboard_url: `${process.env.APP_URL}/dashboard.html?id=${id}&token=${secret_token}`,
    });
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

router.get('/:id/public', async (req, res) => {
  try {
    const link = await get(
      `SELECT id, creator_name, title, description, amount, fee, is_active, created_at
       FROM payment_links WHERE id = ?`,
      [req.params.id]
    );
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json(link);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load link' });
  }
});

router.get('/:id/payments', async (req, res) => {
  try {
    const { token } = req.query;
    const link = await get(
      'SELECT * FROM payment_links WHERE id = ? AND secret_token = ?',
      [req.params.id, token]
    );
    if (!link) return res.status(403).json({ error: 'Invalid token or link not found' });

    const payments = await all(
      `SELECT id, payer_name, payer_phone, amount, fee, net_amount, mpesa_receipt, status, created_at, paid_at
       FROM payments WHERE link_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );

    const stats = await get(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status='success' THEN net_amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status='success' THEN fee ELSE 0 END) as total_fees
       FROM payments WHERE link_id = ?`,
      [req.params.id]
    );

    res.json({ link, payments, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

router.get('/:id/status/:paymentId', async (req, res) => {
  try {
    const payment = await get(
      'SELECT status, mpesa_receipt, paid_at, payer_name FROM payments WHERE id = ? AND link_id = ?',
      [req.params.paymentId, req.params.id]
    );
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;