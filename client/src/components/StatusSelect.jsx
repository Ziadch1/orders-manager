const statusOptions = [
  { value: 'En attente', label: 'En attente' },
  { value: 'Confirmé', label: 'Confirmé' },
  { value: 'Livré', label: 'Livré' },
  { value: 'Annulé', label: 'Annulé' },
  { value: 'Retour', label: 'Retour' },
];

function StatusSelect({ value, onChange, disabled = false }) {
  return (
    <select
      className="select-status"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default StatusSelect;
