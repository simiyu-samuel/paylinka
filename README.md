# PayLinka — M-Pesa Payment Link Generator

Generate shareable M-Pesa payment links in seconds. No login required.

---

## What it does

Anyone visits your site, fills a form (name, what the payment is for, amount), and gets a unique shareable link. They share it on WhatsApp or SMS. Their payers open the link, enter their M-Pesa number, and get an STK push prompt on their phone. You earn **Ksh 3 per transaction** automatically.

**Pages:**
- `/` — create a payment link
- `/pay/:id` — payer opens this, enters phone, pays
- `/success/:id` — receipt page after payment
- `/dashboard.html?id=X&token=Y` — creator views all payments (private, token-protected)

---

## Project structure

```
paylinka/
├── server.js              # Express entry point
├── package.json
├── .env.example           # Copy to .env and fill in
├── db/
│   └── database.js        # SQLite setup + query helpers
├── routes/
│   ├── links.js           # Create link, view payments, check status
│   └── mpesa.js           # STK push + M-Pesa callback
├── utils/
│   └── daraja.js          # Daraja API helper (token, password, STK push)
└── public/
    ├── index.html         # Homepage — create link
    ├── pay.html           # Payment page — payer's view
    ├── success.html       # Receipt page
    └── dashboard.html     # Creator's payments dashboard
```

---

## Setup (local)

### 1. Clone and install

```bash
git clone <your-repo>
cd paylinka
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=3000
APP_URL=http://localhost:3000        # Change to your live URL when deployed

MPESA_ENV=sandbox                    # Change to 'production' when going live
MPESA_CONSUMER_KEY=xxxx              # From Daraja dashboard
MPESA_CONSUMER_SECRET=xxxx          # From Daraja dashboard
MPESA_SHORTCODE=174379               # Sandbox default — use your own in production
MPESA_PASSKEY=bfb279f9...            # Sandbox default — use your own in production

FEE_FLAT=3                           # Your fee per transaction in Ksh
```

### 3. Run

```bash
npm run dev       # Development (auto-restart)
npm start         # Production
```

Open `http://localhost:3000`

---

## Daraja API setup
1. Log in at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Go to **My Apps** → create or select your app
3. Enable **Lipa na M-Pesa Online** (STK Push)
4. Copy **Consumer Key** and **Consumer Secret** into your `.env`
5. For sandbox testing, use:
   - Shortcode: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
   - Test phone: `254708374149` (or use your real number in sandbox — prompts are simulated)

### Callback URL requirement

M-Pesa **requires a public HTTPS URL** to send payment confirmations. In local dev, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Copy the https://xxxx.ngrok.io URL
# Set APP_URL=https://xxxx.ngrok.io in your .env
```

In production, your Railway/Render URL works automatically.

---

## Deployment (Railway — recommended)

Railway gives you a free public HTTPS URL which is exactly what M-Pesa callbacks need.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Then in Railway dashboard:
- Go to **Variables** and add all your `.env` values
- The `APP_URL` should be your Railway public URL (e.g. `https://paylinka-production.up.railway.app`)

Alternatively, use **Render** (free tier):
1. Connect your GitHub repo on render.com
2. Set environment variables in Render dashboard
3. Deploy — you get a free `*.onrender.com` URL

---

## How the money works

The fee is added **on top** of the creator's requested amount. The payer sees and pays the full amount including fee.

Example:
- Creator sets amount: **Ksh 500**
- Fee: **Ksh 3** (configured in `.env` as `FEE_FLAT`)
- Payer is charged: **Ksh 503**
- Creator's net (stored in `net_amount`): **Ksh 500**
- Your platform fee: **Ksh 3**

> **Note:** In Version 1, all payments go to your single M-Pesa shortcode/paybill. You are responsible for forwarding the net amount to each creator manually (or via M-Pesa B2C in Version 2). Track `net_amount` in the database for each payment.

**Revenue potential:**

| Daily transactions | Fee | Monthly earnings |
|---|---|---|
| 100 | Ksh 3 | Ksh 9,000 |
| 300 | Ksh 3 | Ksh 27,000 |
| 1,000 | Ksh 3 | Ksh 90,000 |

---

## Database

SQLite file at `paylinka.db` — created automatically on first run. Two tables:

**`payment_links`** — one row per link created
- `id` — short unique ID (used in URLs)
- `creator_name`, `title`, `description`, `amount`, `fee`
- `secret_token` — random 32-char string for dashboard access (never expose this)
- `is_active` — set to 0 to disable a link

**`payments`** — one row per payment attempt
- `link_id` — foreign key to payment_links
- `payer_name`, `payer_phone`
- `amount` — total charged (including fee)
- `net_amount` — what creator gets
- `fee` — your platform fee
- `mpesa_receipt` — M-Pesa receipt number (confirms real payment)
- `status` — `pending` | `success` | `failed`
- `checkout_request_id` — used to match M-Pesa callbacks

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/links/create` | Create a new payment link |
| `GET` | `/api/links/:id/public` | Get link details (public, no auth) |
| `GET` | `/api/links/:id/payments?token=X` | Get all payments for a link (requires secret token) |
| `GET` | `/api/links/:id/status/:paymentId` | Poll payment status |
| `POST` | `/api/mpesa/pay` | Trigger STK push to payer's phone |
| `POST` | `/api/mpesa/callback` | M-Pesa sends payment result here (no auth) |

---

## Going to production

1. Change `MPESA_ENV=production` in `.env`
2. Replace sandbox shortcode and passkey with your production credentials
3. Register your production callback URL on Daraja:
   - Go to your app → **Lipa na M-Pesa Online** → set callback URL to `https://yourdomain.com/api/mpesa/callback`
4. Test with a real small payment (Ksh 10) before going public
5. Monitor `console.log` output for callback confirmations

---

## Troubleshooting

**STK push not arriving on phone:**
- Make sure `APP_URL` is a public HTTPS URL (not `localhost`)
- Verify consumer key and secret are correct
- Check that the phone number starts with 254 (the `formatPhone` helper handles this)

**Payment stuck on "pending":**
- The callback URL is not reachable — check your deployment URL
- In sandbox, callbacks can be slow; wait up to 60 seconds
- Check server logs for callback errors

**"Invalid access token" error:**
- Daraja tokens expire every hour — the app fetches a fresh one per request, so this shouldn't happen. If it does, check your consumer key/secret

**SQLite errors on Railway:**
- Railway has an ephemeral filesystem — the DB resets on redeploy
- For production, switch to a managed database (see Version 2 doc)