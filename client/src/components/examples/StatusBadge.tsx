import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="p-6 bg-background space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="good" type="uniform" />
        <StatusBadge status="needs-repair" type="uniform" />
        <StatusBadge status="needs-replacement" type="uniform" />
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="paid" type="payment" />
        <StatusBadge status="partial" type="payment" />
        <StatusBadge status="pending" type="payment" />
      </div>
    </div>
  );
}
