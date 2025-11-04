import ParticipantChip from '../ParticipantChip';

export default function ParticipantChipExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <ParticipantChip name="Ana García" color="#3b82f6" />
      <ParticipantChip name="Carlos López" color="#10b981" quantity={2} />
      <ParticipantChip 
        name="María Sánchez" 
        color="#f59e0b" 
        showRemove 
        onRemove={() => console.log('Remove María')} 
      />
    </div>
  );
}
