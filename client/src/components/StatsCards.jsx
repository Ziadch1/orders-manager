function StatsCards({ stats }) {
  return (
    <div className="grid-3">
      <div className="card stats-card">
        <div>
          <strong>{stats.total ?? 0}</strong>
          <span>Total orders</span>
        </div>
      </div>
      <div className="card stats-card">
        <div>
          <strong>{stats.confirmed ?? 0}</strong>
          <span>Confirmed</span>
        </div>
      </div>
      <div className="card stats-card">
        <div>
          <strong>{stats.delivered ?? 0}</strong>
          <span>Delivered</span>
        </div>
      </div>
      <div className="card stats-card">
        <div>
          <strong>{stats.cancelled ?? 0}</strong>
          <span>Cancelled</span>
        </div>
      </div>
      <div className="card stats-card">
        <div>
          <strong>{stats.pending ?? 0}</strong>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
