import { useEffect } from 'react';
import './Toast.css';

const DURATION_MS = 3500;

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={'toast toast--' + type}
      role='alert'
      aria-live='assertive'
      aria-atomic='true'
    >
      <span className='toast__message'>{message}</span>
      <button
        className='toast__close'
        onClick={onClose}
        aria-label='Dismiss notification'
        type='button'
      >
        &times;
      </button>
    </div>
  );
}

export default Toast;
