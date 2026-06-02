(async () => {
  try {
    const ids = [3,4];
    console.log('Deleting ids:', ids);
    const res = await fetch('http://localhost:5000/api/orders/delete-selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    console.log('Delete response:', data);
    const after = await (await fetch('http://localhost:5000/api/orders')).json();
    console.log('Orders after deletion total:', after.total);
    console.log('First page orders after deletion:', JSON.stringify(after.orders.slice(0,5), null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
})();
