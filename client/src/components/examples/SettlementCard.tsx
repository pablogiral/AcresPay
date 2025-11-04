import SettlementCard from '../SettlementCard';
import type { Settlement, Participant } from '@shared/schema';

export default function SettlementCardExample() {
  const participants: Participant[] = [
    { id: '1', name: 'Ana García', color: '#3b82f6' },
    { id: '2', name: 'Carlos López', color: '#10b981' },
    { id: '3', name: 'María Sánchez', color: '#f59e0b' },
  ];

  const settlements: Settlement[] = [
    { from: '2', to: '1', amount: 12.50 },
    { from: '3', to: '1', amount: 8.75 },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      {settlements.map((settlement, idx) => (
        <SettlementCard 
          key={idx} 
          settlement={settlement} 
          participants={participants} 
        />
      ))}
    </div>
  );
}
