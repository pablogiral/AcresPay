import AddItemDialog from '../AddItemDialog';

export default function AddItemDialogExample() {
  return (
    <div className="p-4">
      <AddItemDialog 
        onAdd={(desc, qty, price) => console.log('Added item:', desc, qty, price)} 
      />
    </div>
  );
}
