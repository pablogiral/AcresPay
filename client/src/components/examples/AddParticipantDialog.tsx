import AddParticipantDialog from '../AddParticipantDialog';

export default function AddParticipantDialogExample() {
  return (
    <div className="p-4">
      <AddParticipantDialog onAdd={(name) => console.log('Added participant:', name)} />
    </div>
  );
}
