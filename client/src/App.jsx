import { useState } from 'react';
import NavigationTabs from './components/NavigationTabs.jsx';
import CommandesPage from './pages/CommandesPage.jsx';
import StockagePage from './pages/StockagePage.jsx';

const tabs = [
  { id: 'commandes', label: 'Commandes' },
  { id: 'stockage', label: 'Stockage' },
];

function App() {
  const [activeTab, setActiveTab] = useState('commandes');

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1 className="page-title">Store Orders Manager</h1>
          <p className="subtitle">Import Excel orders, manage statuses, track stock and profit in one place.</p>
        </div>
      </header>

      <NavigationTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'commandes' ? <CommandesPage /> : <StockagePage />}
    </div>
  );
}

export default App;
