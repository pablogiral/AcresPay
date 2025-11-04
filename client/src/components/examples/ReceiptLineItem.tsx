import { useState } from 'react';
import ReceiptLineItem from '../ReceiptLineItem';
import type { LineItem, Participant } from '@shared/schema';

export default function ReceiptLineItemExample() {
  const participants: Participant[] = [
    { id: '1', name: 'Ana García', color: '#3b82f6' },
    { id: '2', name: 'Carlos López', color: '#10b981' },
    { id: '3', name: 'María Sánchez', color: '#f59e0b' },
  ];

  const [item, setItem] = useState<LineItem>({
    id: '1',
    description: 'Cerveza',
    quantity: 4,
    unitPrice: 2.50,
    totalPrice: 10.00,
    isShared: false,
    claims: [
      { participantId: '1', quantity: 2, isShared: false },
      { participantId: '2', quantity: 1, isShared: false },
    ],
  });

  const handleUpdateClaim = (participantId: string, quantity: number) => {
    setItem(prev => {
      const newClaims = prev.claims.filter(c => c.participantId !== participantId);
      if (quantity > 0) {
        newClaims.push({ participantId, quantity, isShared: false });
      }
      return { ...prev, claims: newClaims };
    });
  };

  const handleToggleShared = (isShared: boolean) => {
    console.log('Toggle shared:', isShared);
    setItem(prev => ({
      ...prev,
      isShared,
      claims: [],
    }));
  };

  const handleToggleSharedParticipant = (participantId: string, participating: boolean) => {
    console.log('Toggle participant:', participantId, participating);
    setItem(prev => {
      const newClaims = prev.claims.filter(c => c.participantId !== participantId);
      if (participating) {
        newClaims.push({ participantId, quantity: 1, isShared: prev.isShared });
      }
      return { ...prev, claims: newClaims };
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ReceiptLineItem 
        item={item} 
        participants={participants}
        onUpdateClaim={handleUpdateClaim}
        onToggleShared={handleToggleShared}
        onToggleSharedParticipant={handleToggleSharedParticipant}
      />
    </div>
  );
}
