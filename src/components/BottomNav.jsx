export default function BottomNav({ activeTab, onTabChange, onReport, onReportBlocked, user, isNearGPS }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'carte' ? 'active' : ''}`}
        onClick={() => onTabChange('carte')}
      >
        <span className="nav-icon">🗺️</span>
        <span className="nav-label">Carte</span>
      </button>

      <button
        className={`nav-report-btn ${!isNearGPS ? 'locked' : ''}`}
        onClick={isNearGPS ? onReport : onReportBlocked}
      >
        <span className="nav-report-icon">{isNearGPS ? '🦟' : '🔒'}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'profil' ? 'active' : ''}`}
        onClick={() => onTabChange('profil')}
      >
        <span className="nav-icon">{user ? '👤' : '🔑'}</span>
        <span className="nav-label">{user ? 'Profil' : 'Connexion'}</span>
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
