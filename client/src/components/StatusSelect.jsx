const statusOptions = [
  { value: 'En attente', label: 'En attente' },
  { value: 'Confirmé', label: 'Confirmé' },
  { value: 'Livré', label: 'Livré' },
  { value: 'Annulé', label: 'Annulé' },
];

function StatusSelect({ value, onChange }) {
  return (
    <select className="select-status" value={value} onChange={(event) => onChange(event.target.value)}>
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default StatusSelect;
