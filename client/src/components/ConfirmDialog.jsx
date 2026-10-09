import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, message, onConfirm, onCancel, loading = false }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmRef.current) confirmRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className='confirm-dialog-overlay' role='presentation' onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className='confirm-dialog' role='alertdialog' aria-modal='true' aria-labelledby='confirm-dialog-title' aria-describedby='confirm-dialog-message'>
        <h2 id='confirm-dialog-title' className='confirm-dialog__title'>Confirm Action</h2>
        <p id='confirm-dialog-message' className='confirm-dialog__message'>{message}</p>
        <div className='confirm-dialog__actions'>
          <button type='button' className='btn btn--secondary' onClick={onCancel} disabled={loading}>Cancel</button>
          <button type='button' className='btn btn--danger' onClick={onConfirm} disabled={loading} ref={confirmRef}>
            {loading ? 'Deleting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;