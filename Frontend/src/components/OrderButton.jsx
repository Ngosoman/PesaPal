export default function OrderButton({ isAnimating, isLoading }) {
  return (
    <button
      className={`order${isAnimating ? ' animate' : ''}`}
      type="submit"
      disabled={isLoading}
    >
      <span className="default">
        {isLoading ? 'Processing…' : 'Complete Order'}
      </span>
      <span className="success">
        Order Placed
        <svg viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1" />
        </svg>
      </span>
      <div className="box" />
      <div className="truck">
        <div className="back" />
        <div className="front">
          <div className="window" />
        </div>
        <div className="light top" />
        <div className="light bottom" />
      </div>
      <div className="lines" />
    </button>
  )
}
