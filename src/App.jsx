import { useState, useEffect } from 'react'
import Map from './components/Map'
import ReportModal from './components/ReportModal'
import Badges from './components/Badges'
import BottomNav from './components/BottomNav'
import { supabase, getUserId } from './lib/supabase'
import useGeolocation from './hooks/useGeolocation'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('carte')
  const [showModal, setShowModal] = useState(false)
  const [reports, setReports] = useState([])
  const [userReportCount, setUserReportCount] = useState(0)
  const [newBadge, setNewBadge] = useState(null)
  const position = useGeolocation()

  useEffect(() => {
    fetchReports()
    fetchUserCount()
  }, [])

  async function fetchReports() {
    const { data } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReports(data)
  }

  async function fetchUserCount() {
    const userId = getUserId()
    const { count } = await supabase
      .from('signalements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count !== null) setUserReportCount(count)
  }

  async function handleReport(niveau) {
    if (!position) return
    const userId = getUserId()
    const { error } = await supabase.from('signalements').insert({
      user_id: userId,
      latitude: position.lat,
      longitude: position.lng,
      niveau,
    })
    if (error) {
      console.error('Supabase error:', error)
      throw new Error(error.message)
    }
    setShowModal(false)
    const newCount = userReportCount + 1
    setUserReportCount(newCount)
    fetchReports()
    if (newCount === 1) setNewBadge({ emoji: '🎖️', title: 'Guerre aux Moustiques' })
    else if (newCount === 20) setNewBadge({ emoji: '🛡️', title: 'Anti-Moustiques' })
    else if (newCount === 40) setNewBadge({ emoji: '💥', title: 'Moustique Destructeur' })
  }

  return (
    <div className="app">
      {activeTab === 'carte' && <Map reports={reports} position={position} />}
      {activeTab === 'badges' && <Badges reportCount={userReportCount} />}

      {showModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowModal(false)}
          hasPosition={!!position}
        />
      )}

      {newBadge && (
        <div className="badge-toast" onClick={() => setNewBadge(null)}>
          <span className="toast-emoji">{newBadge.emoji}</span>
          <div>
            <p className="toast-label">Badge débloqué !</p>
            <p className="toast-title">{newBadge.title}</p>
          </div>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReport={() => setShowModal(true)}
      />
    </div>
  )
}
