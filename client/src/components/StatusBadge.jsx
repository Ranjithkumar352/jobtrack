import './StatusBadge.css';

const STATUS_MODIFIERS = {
  Applied:    'applied',
  Assessment: 'assessment',
  Interview:  'interview',
  Selected:   'selected',
  Rejected:   'rejected',
};

function StatusBadge({ status }) {
  const modifier = STATUS_MODIFIERS[status] || 'unknown';
  return (
    <span className={'badge badge--' + modifier}>
      {status || 'Unknown'}
    </span>
  );
}

export default StatusBadge;
