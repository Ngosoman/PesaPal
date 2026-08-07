# PesaPal Payment Gateway Integration

A minimal but complete example of integrating **PesaPal v3** into a full-stack web app.

- **Frontend** — React + Vite (deployed on Vercel)
- **Backend** — Django (deployed on Render)

Live demo: [pesa-pal.vercel.app](https://pesa-pal.vercel.app)

---

## How it works (in a nutshell)

PesaPal acts as the middleman between your app and all payment methods (M-Pesa, Airtel Money, Mastercard, Visa). Your backend never touches card numbers or M-Pesa PINs — you just hand the order off to PesaPal and they handle everything.

```
User fills form on your site
        ↓
Your backend authenticates with PesaPal → submits the order
        ↓
PesaPal returns a redirect URL → user goes to PesaPal's hosted payment page
        ↓
User pays (M-Pesa, Airtel, card — their choice)
        ↓
PesaPal calls your IPN endpoint (background notification)
PesaPal redirects user to your callback URL
        ↓
Your backend checks the payment status → redirects user to your success/failure page
```

The three endpoints your backend must expose:

| Endpoint | Purpose |
|---|---|
| `POST /api/pesapal/initiate/` | Authenticate with PesaPal, register IPN, submit order, return redirect URL |
| `GET /api/pesapal/callback/` | PesaPal sends user here after payment; check status, redirect to frontend |
| `GET /api/pesapal/ipn/` | PesaPal pings this in the background to report payment events |

---

## Using this repo yourself

Clone it, then **the only file you need to edit is `Backend/.env`**.

```bash
git clone https://github.com/Ngosoman/PesaPal.git
cd PesaPal
```

### 1. Fill in your credentials

Open `Backend/.env` and replace the values:

```env
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_ENVIRONMENT=production

# These never change for the v3 API
PESAPAL_AUTH_URL=https://pay.pesapal.com/v3/api/Auth/RequestToken
PESAPAL_SUBMIT_ORDER_URL=https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest
PESAPAL_TRANSACTION_STATUS_URL=https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus
PESAPAL_REGISTER_IPN_URL=https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN

# Your backend's public URL (update when you deploy)
PESAPAL_CALLBACK_URL=http://127.0.0.1:8000/api/pesapal/callback/
PESAPAL_IPN_NOTIFICATION_URL=http://127.0.0.1:8000/api/pesapal/ipn/

# Leave blank — auto-filled on first payment
PESAPAL_IPN_ID=
```

Get your keys from the [PesaPal Merchant Portal](https://pay.pesapal.com/iframe/PesapalIframe3/Index).

### 2. Run the backend

```bash
cd Backend
python -m venv .venv
source .venv/Scripts/activate   # Windows
# source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Run the frontend

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Deploying

| Service | Platform | Notes |
|---|---|---|
| Backend | [Render](https://render.com) | `render.yaml` is included. Set env vars from your `.env` in the Render dashboard. |
| Frontend | [Vercel](https://vercel.com) | `vercel.json` is included. Set `VITE_API_BASE_URL=https://your-render-url.onrender.com`. |

When deployed, update `PESAPAL_CALLBACK_URL` and `PESAPAL_IPN_NOTIFICATION_URL` in Render's environment to use your live Render URL instead of localhost.

---

## Project structure

```
PesaPal/
├── Backend/
│   ├── .env                    ← only file you need to edit
│   ├── requirements.txt
│   ├── render.yaml             ← Render deployment config
│   ├── manage.py
│   ├── core/                   ← Django project settings & URLs
│   └── payments/
│       ├── pesapal.py          ← PesaPal API client (auth, IPN, order, status)
│       ├── views.py            ← initiate / callback / IPN endpoints
│       └── urls.py
└── Frontend/
    ├── .env.production         ← points to your Render backend
    ├── vercel.json             ← Vercel SPA routing config
    ├── package.json
    └── src/
        ├── App.jsx             ← shows form or payment result
        └── components/
            ├── PaymentForm.jsx ← collects billing details + payment method
            └── OrderButton.jsx ← animated truck button
```
