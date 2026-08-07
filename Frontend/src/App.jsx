import { useState, useEffect } from 'react'
import PaymentForm from './components/PaymentForm'

function PaymentResult({ result, onReset }) {
  const isSuccess = result.status === 'completed'
  return (
    <div className={`result-card ${isSuccess ? 'result-success' : 'result-failure'}`}>
      <div className="result-icon">{isSuccess ? '✓' : '✕'}</div>
      <h2>{isSuccess ? 'Payment Successful!' : 'Payment Unsuccessful'}</h2>
      {result.trackingId && (
        <p className="result-detail">
          <span>Tracking ID</span>
          <strong>{result.trackingId}</strong>
        </p>
      )}
      {result.ref && (
        <p className="result-detail">
          <span>Reference</span>
          <strong>{result.ref}</strong>
        </p>
      )}
      {result.message && <p className="result-message">{result.message}</p>}
      <button className="reset-btn" onClick={onReset}>
        {isSuccess ? 'Make Another Payment' : 'Try Again'}
      </button>
    </div>
  )
}

export default function App() {
  const [paymentResult, setPaymentResult] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment) {
      setPaymentResult({
        status:     payment,
        trackingId: params.get('trackingId') || '',
        ref:        params.get('ref') || '',
        message:    params.get('message') || '',
      })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  return (
    <div className="app-container">
      {paymentResult
        ? <PaymentResult result={paymentResult} onReset={() => setPaymentResult(null)} />
        : <PaymentForm />
      }
    </div>
  )
}
