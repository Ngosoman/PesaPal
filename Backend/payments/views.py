import json
import logging
import os

from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .pesapal import get_auth_token, get_or_register_ipn, submit_order, get_transaction_status

logger = logging.getLogger(__name__)


def health(request):
    return JsonResponse({'status': 'ok'})


@csrf_exempt
@require_http_methods(['POST'])
def initiate_payment(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    first_name      = data.get('first_name', '').strip()
    last_name       = data.get('last_name', '').strip()
    email           = data.get('email', '').strip()
    phone           = data.get('phone', '').strip()
    amount          = data.get('amount')
    payment_method  = data.get('payment_method', '').strip()

    if not all([first_name, last_name, email, phone, amount]):
        return JsonResponse({'error': 'All fields are required'}, status=400)

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Amount must be a positive number'}, status=400)

    try:
        token  = get_auth_token()
        ipn_id = get_or_register_ipn(token)
        result = submit_order(token, ipn_id, first_name, last_name, email, phone, amount, payment_method=payment_method)
        return JsonResponse({
            'redirect_url':       result['redirect_url'],
            'order_tracking_id':  result['order_tracking_id'],
            'merchant_reference': result['merchant_reference'],
        })
    except Exception:
        logger.exception('PesaPal initiate_payment error')
        return JsonResponse({'error': 'Payment initiation failed. Please try again.'}, status=500)


@require_http_methods(['GET'])
def payment_callback(request):
    """PesaPal redirects the user here after payment."""
    order_tracking_id  = request.GET.get('OrderTrackingId', '').strip()
    merchant_reference = request.GET.get('OrderMerchantReference', '').strip()
    frontend_url       = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    if not order_tracking_id:
        return HttpResponseRedirect(f'{frontend_url}?payment=error&message=Missing+tracking+ID')

    try:
        token       = get_auth_token()
        status_data = get_transaction_status(token, order_tracking_id)
        status      = status_data.get('payment_status_description', 'Unknown').lower()
        return HttpResponseRedirect(
            f'{frontend_url}?payment={status}'
            f'&trackingId={order_tracking_id}'
            f'&ref={merchant_reference}'
        )
    except Exception:
        logger.exception('PesaPal payment_callback error')
        return HttpResponseRedirect(f'{frontend_url}?payment=error&message=Status+check+failed')


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def payment_ipn(request):
    """Instant Payment Notification — PesaPal calls this to report payment events."""
    order_tracking_id  = request.GET.get('orderTrackingId', '')
    merchant_reference = request.GET.get('orderMerchantReference', '')
    notification_type  = request.GET.get('orderNotificationType', '')

    if order_tracking_id:
        try:
            token = get_auth_token()
            get_transaction_status(token, order_tracking_id)
            # TODO: update your order model here with the returned status
        except Exception:
            logger.exception('PesaPal IPN processing error')

    # PesaPal expects this exact response shape
    return JsonResponse({
        'orderNotificationType': notification_type,
        'orderTrackingId':       order_tracking_id,
        'orderMerchantReference': merchant_reference,
        'status': '200',
    })
