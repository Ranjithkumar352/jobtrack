import './Spinner.css';

function Spinner({ size = 'page' }) {
  return (
    <div
      className={'spinner spinner--' + size}
      role='status'
      aria-label='Loading'
      aria-live='polite'
    >
      <div className='spinner__ring' />
      <span className='spinner__sr-only'>Loading...</span>
    </div>
  );
}

export default Spinner;
