import ReceiptLineItem from '../ReceiptLineItem';
import type { LineItem, Participant } from '@shared/schema';

export default function ReceiptLineItemExample() {
  const participants: Participant[] = [
    { id: '1', name: 'Ana García', color: '#3b82f6' },
    { id: '2', name: 'Carlos López', color: '#10b981' },
  ];

  const items: LineItem[] = [
    {
      id: '1',
      description: 'Paella Valenciana',
      quantity: 1,
      unitPrice: 15.50,
      totalPrice: 15.50,
      claims: [{ participantId: '1', quantity: 1, isShared: true }],
    },
    {
      id: '2',
      description: 'Cerveza',
      quantity: 3,
      unitPrice: 2.50,
      totalPrice: 7.50,
      claims: [
        { participantId: '1', quantity: 2, isShared: false },
        { participantId: '2', quantity: 1, isShared: false },
      ],
    },
    {
      id: '3',
      description: 'Ensalada Mixta',
      quantity: 2,
      unitPrice: 8.00,
      totalPrice: 16.00,
      claims: [],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      {items.map(item => (
        <ReceiptLineItem 
          key={item.id} 
          item={item} 
          participants={participants}
          onClick={() => console.log('Clicked:', item.description)}
        />
      ))}
    </div>
  );
}
