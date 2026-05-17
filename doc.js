const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, TableOfContents
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 160 },
        children: [new TextRun({ text, bold: true, size: 32, font: 'Arial', color: '0A0A0A' })]
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: '1A1A1A' })]
    });
}

function h3(text) {
    return new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: '222222' })]
    });
}

function para(text, options = {}) {
    return new Paragraph({
        spacing: { before: 60, after: 100 },
        children: [new TextRun({ text, size: 22, font: 'Arial', color: '333333', ...options })]
    });
}

function bullet(text, bold = false) {
    return new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 22, font: 'Arial', bold })]
    });
}

function numbered(text) {
    return new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 22, font: 'Arial' })]
    });
}

function code(text) {
    return new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 720 },
        children: [new TextRun({ text, size: 20, font: 'Courier New', color: '005A9E' })]
    });
}

function divider() {
    return new Paragraph({
        spacing: { before: 160, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 1 } },
        children: []
    });
}

function featureTable(rows) {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2600, 4360, 2400],
        rows: [
            new TableRow({
                children: [
                    { label: 'Feature', w: 2600 },
                    { label: 'What to build', w: 4360 },
                    { label: 'Effort', w: 2400 },
                ].map(({ label, w }) => new TableCell({
                    borders,
                    width: { size: w, type: WidthType.DXA },
                    margins: cellMargins,
                    shading: { fill: '0A0A0A', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })]
                }))
            }),
            ...rows.map((row, i) => new TableRow({
                children: row.map((cell, ci) => new TableCell({
                    borders,
                    width: { size: [2600, 4360, 2400][ci], type: WidthType.DXA },
                    margins: cellMargins,
                    shading: { fill: i % 2 === 0 ? 'F9FAF7' : 'FFFFFF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'Arial', bold: ci === 0 })] })]
                }))
            }))
        ]
    });
}

function twoColTable(rows, col1Label = 'Item', col2Label = 'Detail') {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: [
            new TableRow({
                children: [col1Label, col2Label].map((label, i) => new TableCell({
                    borders,
                    width: { size: i === 0 ? 3000 : 6360, type: WidthType.DXA },
                    margins: cellMargins,
                    shading: { fill: '00C853', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })]
                }))
            }),
            ...rows.map((row, i) => new TableRow({
                children: row.map((cell, ci) => new TableCell({
                    borders,
                    width: { size: ci === 0 ? 3000 : 6360, type: WidthType.DXA },
                    margins: cellMargins,
                    shading: { fill: i % 2 === 0 ? 'F9FAF7' : 'FFFFFF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'Arial', bold: ci === 0 })] })]
                }))
            }))
        ]
    });
}

function spacer() {
    return new Paragraph({ spacing: { before: 120, after: 0 }, children: [] });
}

const doc = new Document({
    numbering: {
        config: [
            { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ]
    },
    styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
        paragraphStyles: [
            {
                id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 32, bold: true, font: 'Arial', color: '0A0A0A' },
                paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
            },
            {
                id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 26, bold: true, font: 'Arial', color: '1A1A1A' },
                paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
            },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        children: [
            // Cover
            new Paragraph({ spacing: { before: 480, after: 80 }, children: [new TextRun({ text: 'PayLinka', bold: true, size: 56, font: 'Arial', color: '0A0A0A' })] }),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'Version 2 — Feature Roadmap & Implementation Guide', size: 28, font: 'Arial', color: '00C853', bold: true })] }),
            new Paragraph({ spacing: { before: 0, after: 480 }, children: [new TextRun({ text: 'Pick the features you want to build next. Each section is standalone — implement in any order.', size: 22, font: 'Arial', color: '6B7280' })] }),
            divider(),

            // Overview
            h1('Overview'),
            para('Version 1 is your working foundation — create links, collect M-Pesa payments, view a private dashboard. Version 2 is about growth: user accounts, automated payouts, analytics, subscriptions, and scaling. This document breaks every possible feature into self-contained modules. Pick what makes sense for your users and current stage.'),
            spacer(),

            // Feature overview table
            h2('Feature summary'),
            featureTable([
                ['User accounts', 'Email/phone signup, login, manage multiple links', '1 day'],
                ['Automated payouts', 'B2C API — auto-send net amount to creator after payment', '1 day'],
                ['Custom link slugs', 'paylinka.co.ke/pay/jane instead of random ID', 'Half day'],
                ['SMS notifications', 'Alert creator on every payment via Africa\'s Talking', 'Half day'],
                ['Subscription billing', 'Free/Pro tiers, Stripe or M-Pesa recurring', '2 days'],
                ['Analytics dashboard', 'Charts, revenue trends, peak hours', '1 day'],
                ['Link customisation', 'Logo upload, custom colours, deadline, max payments', '1 day'],
                ['Bulk CSV export', 'Download all payments as spreadsheet', 'Half day'],
                ['Multi-currency (USD)', 'Accept card payments via Stripe alongside M-Pesa', '2 days'],
                ['Admin panel', 'See all users, links, transactions, flag issues', '1 day'],
                ['PostgreSQL migration', 'Replace SQLite for production-grade reliability', 'Half day'],
                ['Rate limiting', 'Prevent abuse, spam STK pushes', 'Half day'],
            ]),
            spacer(),
            divider(),

            // Feature 1 — User Accounts
            h1('Feature 1 — User accounts & authentication'),
            para('Currently anyone can create a link without signing up. Adding accounts lets creators manage multiple links, save their dashboard without a secret token, and unlock paid features.'),

            h2('What to build'),
            bullet('Registration page — phone number or email, password, name'),
            bullet('OTP verification via SMS (Africa\'s Talking) for phone signup'),
            bullet('Login page with session or JWT token'),
            bullet('My links page — see all links you created'),
            bullet('Link to your account instead of a secret token'),
            spacer(),

            h2('Database changes'),
            twoColTable([
                ['New table: users', 'id, name, email, phone, password_hash, created_at, plan (free/pro)'],
                ['Modify: payment_links', 'Add user_id foreign key column'],
                ['New table: sessions', 'id, user_id, token, expires_at (if using server sessions)'],
                ['New table: otp_codes', 'phone, code, expires_at (for SMS verification)'],
            ], 'Table / Column', 'Details'),
            spacer(),

            h2('Packages to install'),
            code('npm install bcryptjs jsonwebtoken express-session connect-sqlite3 express-rate-limit'),
            spacer(),

            h2('Key implementation steps'),
            numbered('Hash passwords with bcryptjs — never store plain text'),
            numbered('Generate a JWT on login — store in httpOnly cookie (not localStorage)'),
            numbered('Create an authMiddleware that checks the JWT on protected routes'),
            numbered('Add GET /api/me to return current user from token'),
            numbered('Protect GET /api/links/mine with authMiddleware'),
            numbered('Update POST /api/links/create to attach the logged-in user_id'),
            spacer(),

            h2('Recommended OTP flow'),
            bullet('User enters phone on register'),
            bullet('Server generates 6-digit code, stores with 5-minute expiry'),
            bullet('SMS sent via Africa\'s Talking API'),
            bullet('User enters code on next screen'),
            bullet('Account activated on correct code'),
            spacer(),
            divider(),

            // Feature 2 — Automated Payouts
            h1('Feature 2 — Automated payouts (B2C API)'),
            para('Currently all payments go to your shortcode and you forward manually. B2C (Business to Customer) lets your server automatically send the net amount to the creator\'s M-Pesa number seconds after a payment is confirmed.'),

            h2('How it works'),
            bullet('M-Pesa sends callback → your server confirms payment success'),
            bullet('Server calls Daraja B2C API to send net_amount to creator\'s phone'),
            bullet('Creator gets M-Pesa SMS with the money — instant'),
            bullet('You keep the fee (Ksh 3) in your shortcode balance'),
            spacer(),

            h2('Daraja B2C setup'),
            numbered('On Daraja dashboard, enable B2C under your app'),
            numbered('You need a registered Safaricom Business shortcode (Paybill or Till)'),
            numbered('Download your B2C security credential certificate from Daraja'),
            numbered('Encrypt your initiator password with the certificate (openssl command)'),
            spacer(),

            h2('B2C API call'),
            code('POST https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'),
            spacer(),
            twoColTable([
                ['InitiatorName', 'Your API operator username (set on Daraja)'],
                ['SecurityCredential', 'Encrypted password (openssl + certificate)'],
                ['CommandID', 'BusinessPayment (for regular business payments)'],
                ['Amount', 'net_amount from your payments table'],
                ['PartyA', 'Your shortcode (sender)'],
                ['PartyB', 'Creator\'s phone number (recipient)'],
                ['QueueTimeOutURL', 'Your callback if request times out'],
                ['ResultURL', 'Your callback when payout is confirmed'],
            ], 'Parameter', 'Value'),
            spacer(),

            h2('Database changes'),
            bullet('Add payout_status column to payments: null | sent | failed'),
            bullet('Add payout_receipt column for B2C transaction ID'),
            bullet('Add creator_phone to payment_links (required for auto payout)'),
            spacer(),

            h2('Important notes'),
            bullet('B2C has daily limits — check Safaricom documentation for your tier'),
            bullet('Test B2C in sandbox before going live (sandbox B2C uses test numbers)'),
            bullet('Add retry logic — if B2C fails, queue and retry after 5 minutes'),
            bullet('Log every payout attempt for dispute resolution'),
            spacer(),
            divider(),

            // Feature 3 — Custom Slugs
            h1('Feature 3 — Custom link slugs'),
            para('Instead of /pay/aB3kL9xQmN, creators get /pay/jane or /pay/janes-boutique. Makes links more trustworthy and easy to share verbally.'),

            h2('What to build'),
            bullet('Slug input field on the create link form'),
            bullet('Validation — lowercase, letters/numbers/hyphens only, 3-30 chars'),
            bullet('Check uniqueness before saving (query DB for existing slug)'),
            bullet('Fallback to auto-generated ID if slug taken'),
            bullet('Route: /pay/:slug — look up by slug OR by id'),
            spacer(),

            h2('Database change'),
            code('ALTER TABLE payment_links ADD COLUMN slug TEXT UNIQUE;'),
            code('CREATE UNIQUE INDEX idx_slug ON payment_links(slug);'),
            spacer(),

            h2('Slug validation regex'),
            code('const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;'),
            spacer(),
            divider(),

            // Feature 4 — SMS Notifications
            h1('Feature 4 — SMS notifications to creator'),
            para('When someone pays, the link creator gets an SMS: "John paid Ksh 500 for Trip contribution. Receipt: QHX123456."'),

            h2('Service to use'),
            para('Africa\'s Talking — Kenyan SMS gateway, easy API, pay-as-you-go. About Ksh 1 per SMS.'),
            code('npm install africastalking'),
            spacer(),

            h2('Implementation'),
            numbered('Creator adds their phone number when creating a link (or from their account)'),
            numbered('In the M-Pesa callback handler (routes/mpesa.js), after marking payment success:'),
            numbered('Call Africa\'s Talking SMS API to notify creator'),
            numbered('Keep SMS async — don\'t let SMS failure break the payment confirmation'),
            spacer(),

            h2('SMS template'),
            code('`[PayLinka] ${payerName} paid Ksh ${netAmount} for "${linkTitle}". Receipt: ${mpesaReceipt}.`'),
            spacer(),

            h2('Environment variables to add'),
            code('AFRICASTALKING_API_KEY=your_key'),
            code('AFRICASTALKING_USERNAME=your_username'),
            spacer(),
            divider(),

            // Feature 5 — Subscription Plans
            h1('Feature 5 — Free / Pro subscription plans'),
            para('The free tier lets users create up to 10 links/month. Pro (Ksh 499/month) unlocks unlimited links, custom slugs, SMS notifications, and CSV exports.'),

            h2('Plan comparison'),
            twoColTable([
                ['Links per month', 'Free: 10 | Pro: Unlimited'],
                ['Custom slugs', 'Free: No | Pro: Yes'],
                ['SMS notifications', 'Free: No | Pro: Yes'],
                ['CSV export', 'Free: No | Pro: Yes'],
                ['Dashboard branding', 'Free: PayLinka logo | Pro: Custom name'],
                ['Priority support', 'Free: No | Pro: Yes'],
                ['Price', 'Free: Ksh 0 | Pro: Ksh 499/month'],
            ], 'Feature', 'Availability'),
            spacer(),

            h2('Billing options (Kenyan market)'),
            bullet('M-Pesa STK Push — most Kenyan users prefer this. Manual monthly trigger or use Safaricom\'s Standing Order API for recurring.', true),
            bullet('Stripe — good for card payments, easy recurring, but less common in Kenya'),
            bullet('Flutterwave — supports M-Pesa + cards, good middle ground'),
            spacer(),

            h2('Implementation steps'),
            numbered('Add plan column to users table (free | pro | expired)'),
            numbered('Add plan_expires_at timestamp'),
            numbered('Create /api/billing/upgrade endpoint that triggers M-Pesa STK push for Ksh 499'),
            numbered('On payment callback, update user plan to pro, set plan_expires_at = now + 30 days'),
            numbered('Add plan enforcement middleware — check plan before creating more than 10 links'),
            numbered('Run a daily cron job to expire plans past their expiry date'),
            spacer(),
            divider(),

            // Feature 6 — Analytics
            h1('Feature 6 — Analytics dashboard'),
            para('Show creators charts of their payment activity: daily revenue, peak hours, payment success rate, top payers.'),

            h2('Charts to build'),
            bullet('Revenue per day — bar chart for last 30 days'),
            bullet('Payments by hour — which hours get most payments'),
            bullet('Success rate — pie chart of success vs failed vs pending'),
            bullet('Top payers — list of phones that have paid most'),
            spacer(),

            h2('Library recommendation'),
            code('Use Chart.js (CDN, no install) or Recharts if you convert frontend to React'),
            spacer(),

            h2('New API endpoints'),
            twoColTable([
                ['GET /api/links/:id/analytics?token=X', 'Returns daily totals, hourly breakdown, success rate'],
                ['GET /api/me/analytics', 'Aggregate stats across all user\'s links (Pro only)'],
            ], 'Endpoint', 'Purpose'),
            spacer(),
            divider(),

            // Feature 7 — Link customisation
            h1('Feature 7 — Link customisation options'),
            para('Let creators control how their payment page looks and behaves.'),

            h2('Options to add'),
            twoColTable([
                ['Payment deadline', 'Link expires after a date — good for event payments'],
                ['Max payments', 'Limit to e.g. 50 people — first come first served'],
                ['Allow any amount', 'Toggle: payer enters their own amount (tips, donations)'],
                ['Custom thank-you message', 'Creator writes what payer sees on success page'],
                ['Logo/image URL', 'Creator pastes an image URL shown on payment page'],
                ['Primary colour', 'Hex colour for the payment page accent colour'],
            ], 'Option', 'Description'),
            spacer(),

            h2('Database columns to add to payment_links'),
            code('expires_at DATETIME DEFAULT NULL'),
            code('max_payments INTEGER DEFAULT NULL'),
            code('allow_custom_amount INTEGER DEFAULT 0'),
            code('thank_you_message TEXT DEFAULT NULL'),
            code('image_url TEXT DEFAULT NULL'),
            code('accent_color TEXT DEFAULT \'#00C853\''),
            spacer(),
            divider(),

            // Feature 8 — CSV Export
            h1('Feature 8 — CSV export'),
            para('Pro users can download all payments for a link as a spreadsheet. Useful for bookkeeping and reconciliation.'),

            h2('Implementation (30 minutes)'),
            numbered('Add GET /api/links/:id/export?token=X endpoint'),
            numbered('Query all payments for the link, format as CSV string'),
            numbered('Set headers: Content-Type: text/csv, Content-Disposition: attachment; filename=payments.csv'),
            numbered('Add Download CSV button to dashboard.html (hidden behind plan check)'),
            spacer(),

            h2('CSV columns'),
            code('Date, Time, Payer Name, Phone, Amount (Ksh), Fee (Ksh), Net Amount (Ksh), M-Pesa Receipt, Status'),
            spacer(),
            divider(),

            // Feature 9 — PostgreSQL
            h1('Feature 9 — PostgreSQL migration'),
            para('SQLite works for V1 but resets on some hosting platforms (Railway ephemeral disk) and has write-lock issues under load. Switch to PostgreSQL for production.'),

            h2('Steps'),
            numbered('Set up a free PostgreSQL database — Neon.tech (free tier) or Railway Postgres add-on'),
            numbered('Install: npm install pg'),
            numbered('Replace sqlite3 calls in db/database.js with pg Pool queries'),
            numbered('Queries are mostly compatible — main differences: ? placeholders become $1 $2 etc.'),
            numbered('Run CREATE TABLE statements once on the new DB'),
            numbered('Add DATABASE_URL to your .env'),
            spacer(),

            h2('Connection setup'),
            code('const { Pool } = require(\'pg\');'),
            code('const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });'),
            spacer(),
            divider(),

            // Feature 10 — Admin Panel
            h1('Feature 10 — Admin panel'),
            para('A private page (protected by a separate admin password) to see all users, links, and transactions across the platform.'),

            h2('What to show'),
            bullet('Total revenue collected platform-wide today / this month'),
            bullet('Total fees earned (your income)'),
            bullet('New users registered today'),
            bullet('Links created and payments processed'),
            bullet('Ability to deactivate a link (set is_active = 0)'),
            bullet('Search transactions by M-Pesa receipt number'),
            spacer(),

            h2('Security'),
            bullet('Protect with a separate ADMIN_TOKEN environment variable — not connected to user accounts'),
            bullet('Never expose admin routes to the public'),
            bullet('Log every admin action with timestamp'),
            spacer(),
            divider(),

            // Deployment upgrade
            h1('Deployment upgrades for Version 2'),
            h2('Switch from Railway free to paid (when needed)'),
            bullet('Railway free tier has usage limits — upgrade when you have regular traffic'),
            bullet('Cost: $5/month for Hobby plan — worth it once you\'re earning Ksh 5,000+/month'),
            spacer(),

            h2('Add a custom domain'),
            numbered('Buy a .co.ke domain from Kenya Network Information Centre (kenic.or.ke) or Safaricom Domains'),
            numbered('Point DNS to Railway/Render via CNAME record'),
            numbered('Railway handles SSL certificate automatically'),
            numbered('Update APP_URL in .env and Daraja callback URL to your domain'),
            spacer(),

            h2('Environment variables for V2'),
            twoColTable([
                ['DATABASE_URL', 'PostgreSQL connection string'],
                ['JWT_SECRET', 'Random 64-char string for signing tokens'],
                ['SESSION_SECRET', 'Random 64-char string for express-session'],
                ['AFRICASTALKING_API_KEY', 'Africa\'s Talking API key'],
                ['AFRICASTALKING_USERNAME', 'Africa\'s Talking username'],
                ['MPESA_B2C_INITIATOR', 'B2C initiator name from Daraja'],
                ['MPESA_B2C_CREDENTIAL', 'Encrypted B2C security credential'],
                ['ADMIN_TOKEN', 'Secret token for admin panel access'],
                ['STRIPE_SECRET_KEY', 'If adding card payments via Stripe'],
            ], 'Variable', 'Purpose'),
            spacer(),
            divider(),

            // Quick wins summary
            h1('Recommended build order'),
            para('If you\'re unsure where to start, here\'s the highest-impact order based on what will make you more money fastest:'),
            spacer(),
            twoColTable([
                ['1st — SMS notifications', 'Users trust the platform more. 1 day to build, big retention impact.'],
                ['2nd — User accounts', 'Lets you build a real user base and enforce plan limits.'],
                ['3rd — Subscription billing (Pro)', 'First recurring revenue. Unlocks predictable monthly income.'],
                ['4th — Custom slugs', 'Small feature but big on user delight and shareability.'],
                ['5th — Automated payouts (B2C)', 'Eliminates manual work as volume grows. Essential at scale.'],
                ['6th — Analytics', 'Pro users will love it. Justifies the subscription price.'],
                ['7th — PostgreSQL migration', 'Do this before launch or when approaching 500+ daily payments.'],
                ['8th — Admin panel', 'Build once you have enough users to need oversight.'],
            ], 'Priority', 'Why'),

            spacer(),
            divider(),
            new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'PayLinka V2 Roadmap — generated by Claude', size: 18, font: 'Arial', color: 'AAAAAA', italics: true })] }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/mnt/user-data/outputs/paylinka-v2-roadmap.docx', buffer);
    console.log('Done: paylinka-v2-roadmap.docx');
});