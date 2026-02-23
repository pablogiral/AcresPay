import { useState } from 'react';
import ItemClaimSheet from '../ItemClaimSheet';
import { Button } from '@/components/ui/button';
import type { LineItemWithClaims } from '@shared/schema';

export default function ItemClaimSheetExample() {
  const [open, setOpen] = useState(false);
  
  const item: LineItemWithClaims = {
    id: '1',
    description: 'Paella Valenciana',
    quantity: 2,
    unitPrice: 15.50,
    totalPrice: 31.00,
    isShared: false,
    claims: [{ participantId: '1', quantity: 1, isShared: false }],
  };

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)} data-testid="button-open-sheet">
        Abrir Selector de Cantidad
      </Button>
      <ItemClaimSheet
        open={open}
        onOpenChange={setOpen}
        item={item}
        participantName="Ana García"
        onClaim={(qty, shared) => console.log('Claimed:', qty, shared ? 'shared' : 'individual')}
      />
    </div>
  );
}
