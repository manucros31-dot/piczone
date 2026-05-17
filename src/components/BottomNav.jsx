export default function BottomNav({ activeTab, onTabChange, onReport, onContest, contestMode, user }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'carte' && !contestMode ? 'active' : ''}`}
        onClick={() => onTabChange('carte')}
      >
        <span className="nav-icon">🗺️</span>
        <span className="nav-label">Carte</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'badges' ? 'active' : ''}`}
        onClick={() => onTabChange('badges')}
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Badges</span>
      </button>

      <button className="nav-report-btn" onClick={onReport}>
        <span className="nav-report-icon">🦟</span>
      </button>

      <button
        className={`nav-item ${contestMode ? 'active contest-active' : ''}`}
        onClick={onContest}
      >
        <span className="nav-icon">⚠️</span>
        <span className="nav-label">Contester</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'profil' ? 'active' : ''}`}
        onClick={() => onTabChange('profil')}
      >
        <span className="nav-icon">{user ? '👤' : '🔑'}</span>
        <span className="nav-label">{user ? 'Profil' : 'Connexion'}</span>
      </button>
    </nav>
  )
}
