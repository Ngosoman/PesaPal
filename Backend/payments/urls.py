from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_payment,  name='pesapal-initiate'),
    path('callback/', views.payment_callback,  name='pesapal-callback'),
    path('ipn/',      views.payment_ipn,       name='pesapal-ipn'),
]
