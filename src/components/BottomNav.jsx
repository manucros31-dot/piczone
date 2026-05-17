export default function BottomNav({ activeTab, onTabChange, onReport }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'carte' ? 'active' : ''}`}
        onClick={() => onTabChange('carte')}
      >
        <span className="nav-icon">🗺️</span>
        <span className="nav-label">Carte</span>
      </button>

      <button className="nav-report-btn" onClick={onReport}>
        <span className="nav-report-icon">🦟</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'badges' ? 'active' : ''}`}
        onClick={() => onTabChange('badges')}
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Badges</span>
      </button>
    </nav>
  )
}
