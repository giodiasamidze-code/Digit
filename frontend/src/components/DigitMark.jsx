import './DigitMark.css'

function DigitMark({ size = 'md', className = '' }) {
  return (
    <span
      className={`digit-mark digit-mark--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" className="digit-mark__bg" />
        <path
          d="M12 10h8.5c7.5 0 11.5 4.5 11.5 10s-4 10-11.5 10H12V10z"
          className="digit-mark__letter"
        />
        <circle cx="30" cy="12" r="3" className="digit-mark__accent" />
      </svg>
    </span>
  )
}

export default DigitMark
