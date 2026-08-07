import os
import uuid
import requests
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# In-process cache so IPN is only registered once per server run
_ipn_id_cache = None


def get_auth_token():
    response = requests.post(
        os.environ['PESAPAL_AUTH_URL'],
        json={
            'consumer_key': os.environ['PESAPAL_CONSUMER_KEY'],
            'consumer_secret': os.environ['PESAPAL_CONSUMER_SECRET'],
        },
        headers={'Accept': 'application/json', 'Content-Type': 'application/json'},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()['token']


def get_or_register_ipn(token):
    global _ipn_id_cache

    if _ipn_id_cache:
        return _ipn_id_cache

    ipn_id = os.environ.get('PESAPAL_IPN_ID', '').strip()
    if ipn_id:
        _ipn_id_cache = ipn_id
        return ipn_id

    # First run — register an IPN URL with PesaPal and persist the returned ID
    ipn_url = os.environ.get('PESAPAL_IPN_NOTIFICATION_URL', 'http://127.0.0.1:8000/api/pesapal/ipn/')
    response = requests.post(
        os.environ['PESAPAL_REGISTER_IPN_URL'],
        json={'url': ipn_url, 'ipn_notification_type': 'GET'},
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        timeout=30,
    )
    response.raise_for_status()
    ipn_id = response.json()['ipn_id']

    _persist_ipn_id(ipn_id)
    os.environ['PESAPAL_IPN_ID'] = ipn_id
    _ipn_id_cache = ipn_id
    return ipn_id


def _persist_ipn_id(ipn_id):
    env_path = BASE_DIR / '.env'
    if not env_path.exists():
        return
    lines = env_path.read_text(encoding='utf-8').splitlines()
    for i, line in enumerate(lines):
        if line.startswith('PESAPAL_IPN_ID='):
            lines[i] = f'PESAPAL_IPN_ID={ipn_id}'
            break
    env_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def submit_order(token, ipn_id, first_name, last_name, email, phone, amount, currency='KES', payment_method=''):
    order_id = str(uuid.uuid4())
    description = f'Payment \u2014 {first_name} {last_name}'
    if payment_method:
        description += f' via {payment_method}'
    response = requests.post(
        os.environ['PESAPAL_SUBMIT_ORDER_URL'],
        json={
            'id': order_id,
            'currency': currency,
            'amount': float(amount),
            'description': description,
            'callback_url': os.environ['PESAPAL_CALLBACK_URL'],
            'notification_id': ipn_id,
            'billing_address': {
                'first_name': first_name,
                'last_name': last_name,
                'email_address': email,
                'phone_number': phone,
            },
        },
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def get_transaction_status(token, order_tracking_id):
    url = f"{os.environ['PESAPAL_TRANSACTION_STATUS_URL']}?orderTrackingId={order_tracking_id}"
    response = requests.get(
        url,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()
