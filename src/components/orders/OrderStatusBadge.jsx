import Badge from '../ui/Badge';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/orderStatus';

export default function OrderStatusBadge({ status }) {
  const variant = STATUS_COLORS[status] || 'slate';
  const label = STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
