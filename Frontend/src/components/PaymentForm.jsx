import { useState } from 'react'
import OrderButton from './OrderButton'

const PAYMENT_METHODS = [
  { value: 'MPESA',        label: 'M-Pesa',       icon: '📱', color: '#00a651' },
  { value: 'AIRTEL',       label: 'Airtel Money',  icon: '📱', color: '#e4002b' },
  { value: 'MASTERCARD',   label: 'Mastercard',    icon: '💳', color: '#eb001b' },
  { value: 'VISA',         label: 'Visa Card',     icon: '💳', color: '#1a1f71' },
]

export default function PaymentForm() {
  const [formData, setFormData] = useState({
    first_name:     '',
    last_name:      '',
    email:          '',
    phone:          '',
    amount:         '',
    payment_method: '',
  })
  const [error,       setError]       = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLoading || isAnimating) return

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/pesapal/initiate/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        // Response was not JSON — show first 120 chars to help diagnose
        setError(`Server error (${response.status}): ${text.slice(0, 120)}`)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        setError(data.error || 'Payment initiation failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Start animation, then redirect to PesaPal hosted payment page
      setIsLoading(false)
      setIsAnimating(true)
      setTimeout(() => {
        window.location.href = data.redirect_url
      }, 2000)

    } catch (err) {
      // SyntaxError means the response wasn't JSON — likely the API URL is wrong or unset
      const msg = err instanceof SyntaxError
        ? 'Configuration error: could not reach the payment server.'
        : 'Network error. Please check your connection and try again.'
      setError(msg)
      setIsLoading(false)
    }
  }

  const disabled = isLoading || isAnimating

  return (
    <div className="payment-card">
      <div className="card-header">
        <h1>Complete Your Order</h1>
        <p>Secure payment powered by PesaPal</p>
      </div>

      <form onSubmit={handleSubmit} className="payment-form" noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John"
              required
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
              required
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+254700000000"
            required
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <div className="amount-wrapper">
            <span className="currency-badge">KES</span>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="1000"
              min="1"
              step="0.01"
              required
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="payment_method">Payment Method</label>
          <div className="method-select-wrapper">
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              disabled={disabled}
              className={`method-select${formData.payment_method ? ' has-value' : ''}`}
              style={formData.payment_method
                ? { borderColor: PAYMENT_METHODS.find(m => m.value === formData.payment_method)?.color }
                : {}}
            >
              <option value="" disabled>Select a payment method</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.icon}  {m.label}
                </option>
              ))}
            </select>
            {formData.payment_method && (
              <span
                className="method-badge"
                style={{ background: PAYMENT_METHODS.find(m => m.value === formData.payment_method)?.color }}
              >
                {PAYMENT_METHODS.find(m => m.value === formData.payment_method)?.label}
              </span>
            )}
          </div>
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}

        <div className="button-wrapper">
          <OrderButton isAnimating={isAnimating} isLoading={isLoading} />
        </div>
      </form>
    </div>
  )
}
