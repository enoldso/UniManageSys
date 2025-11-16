import StatsCard from '../StatsCard';
import { Users } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl">
        <StatsCard 
          title="Total Students" 
          value="1,234" 
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
      </div>
    </div>
  );
}
