import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: 'uniform' | 'payment' | 'repair' | 'resupply';
}

const statusConfig = {
  uniform: {
    good: { label: 'Good Condition', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    'needs-repair': { label: 'Needs Repair', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'needs-replacement': { label: 'Needs Replacement', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  },
  payment: {
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    pending: { label: 'Pending', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  },
  repair: {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  },
  resupply: {
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'in-transit': { label: 'In Transit', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  },
};

export default function StatusBadge({ status, type = 'uniform' }: StatusBadgeProps) {
  const typeConfig = statusConfig[type];
  const config = (typeConfig && status in typeConfig 
    ? typeConfig[status as keyof typeof typeConfig]
    : null) || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} border-0`}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
