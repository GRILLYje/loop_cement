import { useState, useEffect, useRef } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

interface Timer {
  id: string
  name: string
  initialSeconds: number
  remainingSeconds: number
  status: 'idle' | 'running' | 'paused' | 'finished'
}

function App() {
  const [timers, setTimers] = useState<Timer[]>([])
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerMinutes, setNewTimerMinutes] = useState(0)
  const [newTimerSeconds, setNewTimerSeconds] = useState(30)
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingMinutes, setEditingMinutes] = useState<number>(0)
  const [editingSeconds, setEditingSeconds] = useState<number>(30)
  const [editingName, setEditingName] = useState<string>('')
  const intervalRefs = useRef<{ [key: string]: ReturnType<typeof setInterval> }>({})

  // Load timers from database on mount
  useEffect(() => {
    loadTimers()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('timers-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'timers'
        },
        (payload) => {
          console.log('Realtime update:', payload.eventType, payload)
          
          if (payload.eventType === 'DELETE') {
            // Remove deleted timer
            const deletedId = (payload.old as any)?.id
            if (deletedId) {
              setTimers(prevTimers => prevTimers.filter(t => t.id !== deletedId))
              if (intervalRefs.current[deletedId]) {
                clearInterval(intervalRefs.current[deletedId])
                delete intervalRefs.current[deletedId]
              }
            }
          } else if (payload.eventType === 'INSERT') {
            // Add new timer
            if (payload.new) {
              const newTimer: Timer = {
                id: payload.new.id,
                name: payload.new.name,
                initialSeconds: payload.new.initial_seconds,
                remainingSeconds: payload.new.remaining_seconds,
                status: payload.new.status as Timer['status']
              }
              
              setTimers(prevTimers => {
                // Check if timer already exists (avoid duplicates)
                const exists = prevTimers.find(t => t.id === newTimer.id)
                if (!exists) {
                  // Add and sort by remaining seconds (ascending)
                  const updated = [...prevTimers, newTimer]
                  updated.sort((a, b) => a.remainingSeconds - b.remainingSeconds)
                  return updated
                }
                return prevTimers
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing timer
            if (payload.new) {
              const updatedTimer: Timer = {
                id: payload.new.id,
                name: payload.new.name,
                initialSeconds: payload.new.initial_seconds,
                remainingSeconds: payload.new.remaining_seconds,
                status: payload.new.status as Timer['status']
              }
              
              setTimers(prevTimers => {
                const existingIndex = prevTimers.findIndex(t => t.id === updatedTimer.id)
                if (existingIndex >= 0) {
                  const existingTimer = prevTimers[existingIndex]
                  
                  // Only update if timer is running and the update is from another client
                  // If it's our own timer running, ignore realtime updates to prevent double counting
                  if (existingTimer.status === 'running' && updatedTimer.status === 'running') {
                    // Only sync if the difference is significant (more than 2 seconds)
                    // This prevents rapid updates from causing double counting
                    const timeDiff = Math.abs(existingTimer.remainingSeconds - updatedTimer.remainingSeconds)
                    if (timeDiff <= 2) {
                      // Too close, ignore to prevent double counting
                      return prevTimers
                    }
                  }
                  
                  // Update existing timer
                  const updated = [...prevTimers]
                  updated[existingIndex] = updatedTimer
                  
                  // Handle status changes
                  if (updatedTimer.status !== 'running' && intervalRefs.current[updatedTimer.id]) {
                    clearInterval(intervalRefs.current[updatedTimer.id])
                    delete intervalRefs.current[updatedTimer.id]
                  }
                  
                  // Sort by remaining seconds (ascending - least time first)
                  updated.sort((a, b) => a.remainingSeconds - b.remainingSeconds)
                  return updated
                } else {
                  // Timer not found, add it and sort
                  const updated = [...prevTimers, updatedTimer]
                  updated.sort((a, b) => a.remainingSeconds - b.remainingSeconds)
                  return updated
                }
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    // Cleanup intervals on unmount
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        clearInterval(interval)
      })
    }
  }, [])

  useEffect(() => {
    // Update countdown for running timers - use local state for countdown
    timers.forEach(timer => {
      if (timer.status === 'running') {
        if (!intervalRefs.current[timer.id]) {
          const updateInterval = setInterval(() => {
            setTimers(prevTimers => {
              return prevTimers.map(t => {
                if (t.id === timer.id && t.status === 'running') {
                  if (t.remainingSeconds > 0) {
                    const newRemainingSeconds = t.remainingSeconds - 1
                    
                    // Update database every 5 seconds to reduce API calls and prevent race conditions
                    if (newRemainingSeconds > 0 && newRemainingSeconds % 5 === 0) {
                      // Update database in background - don't wait for it
                      supabase
                        .from('timers')
                        .update({
                          remaining_seconds: newRemainingSeconds,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', timer.id)
                        .eq('status', 'running')
                        .then(() => {
                          // Ignore errors - realtime will sync
                        })
                        .catch(() => {
                          // Ignore errors
                        })
                    }
                    
                    return { ...t, remainingSeconds: newRemainingSeconds }
                  } else {
                    // Timer finished
                    clearInterval(intervalRefs.current[timer.id])
                    delete intervalRefs.current[timer.id]
                    
                    // Update database
                    supabase
                      .from('timers')
                      .update({
                        remaining_seconds: 0,
                        status: 'finished',
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', timer.id)
                      .catch(() => {
                        // Ignore errors
                      })
                    
                    return { ...t, status: 'finished' as const, remainingSeconds: 0 }
                  }
                }
                return t
              })
            })
          }, 1000)
          
          intervalRefs.current[timer.id] = updateInterval
        }
      } else {
        // Clear interval if timer is not running
        if (intervalRefs.current[timer.id]) {
          clearInterval(intervalRefs.current[timer.id])
          delete intervalRefs.current[timer.id]
        }
      }
    })
  }, [timers])

  const loadTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const loadedTimers: Timer[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          initialSeconds: t.initial_seconds,
          remainingSeconds: t.remaining_seconds,
          status: t.status as Timer['status']
        }))
        // Sort by remaining seconds (ascending - least time first)
        loadedTimers.sort((a, b) => a.remainingSeconds - b.remainingSeconds)
        setTimers(loadedTimers)
      }
    } catch (error) {
      console.error('Error loading timers:', error)
      // Fallback to local storage if database fails
      const localTimers = localStorage.getItem('timers')
      if (localTimers) {
        setTimers(JSON.parse(localTimers))
      }
    }
  }

  const saveTimerToDB = async (timer: Timer) => {
    try {
      const { error } = await supabase
        .from('timers')
        .upsert({
          id: timer.id,
          name: timer.name,
          initial_seconds: timer.initialSeconds,
          remaining_seconds: timer.remainingSeconds,
          status: timer.status,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving timer:', error)
      // Fallback to local storage
      localStorage.setItem('timers', JSON.stringify(timers))
    }
  }

  const deleteTimerFromDB = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting timer:', error)
    }
  }

  const createTimer = async () => {
    const totalSeconds = newTimerMinutes * 60 + newTimerSeconds
    if (!newTimerName.trim() || totalSeconds <= 0) {
      alert('กรุณากรอกชื่อและเวลาที่ถูกต้อง')
      return
    }

    const newTimer: Timer = {
      id: Date.now().toString(),
      name: newTimerName.trim(),
      initialSeconds: totalSeconds,
      remainingSeconds: totalSeconds,
      status: 'idle'
    }

    // Save to database first - Realtime will handle adding to state
    try {
      const { error } = await supabase
        .from('timers')
        .insert({
          id: newTimer.id,
          name: newTimer.name,
          initial_seconds: newTimer.initialSeconds,
          remaining_seconds: newTimer.remainingSeconds,
          status: newTimer.status
        })

      if (error) throw error

      // Clear form - Realtime subscription will add timer to state
      setNewTimerName('')
      setNewTimerMinutes(0)
      setNewTimerSeconds(30)
    } catch (error) {
      console.error('Error creating timer:', error)
      alert('เกิดข้อผิดพลาดในการสร้าง Timer')
    }
  }

  const startTimer = async (id: string) => {
    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer =>
        timer.id === id ? { ...timer, status: 'running' as const } : timer
      )
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
  }

  const pauseTimer = async (id: string) => {
    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer =>
        timer.id === id ? { ...timer, status: 'paused' as const } : timer
      )
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
  }

  const resumeTimer = async (id: string) => {
    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer =>
        timer.id === id ? { ...timer, status: 'running' as const } : timer
      )
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
  }

  const resetTimer = async (id: string) => {
    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer => {
        if (timer.id === id) {
          if (intervalRefs.current[id]) {
            clearInterval(intervalRefs.current[id])
            delete intervalRefs.current[id]
          }
          return {
            ...timer,
            remainingSeconds: timer.initialSeconds,
            status: 'idle' as const
          }
        }
        return timer
      })
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
  }

  const cancelTimer = async (id: string) => {
    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer => {
        if (timer.id === id) {
          if (intervalRefs.current[id]) {
            clearInterval(intervalRefs.current[id])
            delete intervalRefs.current[id]
          }
          return { ...timer, status: 'idle' as const }
        }
        return timer
      })
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
  }

  const deleteTimer = async (id: string) => {
    // Clear interval first
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id])
      delete intervalRefs.current[id]
    }

    // Delete from database - Realtime will handle removing from state
    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', id)

      if (error) throw error
      // Realtime subscription will remove timer from state automatically
    } catch (error) {
      console.error('Error deleting timer:', error)
      alert('เกิดข้อผิดพลาดในการลบ Timer')
    }
  }

  const startEditTime = (id: string) => {
    const timer = timers.find(t => t.id === id)
    if (timer) {
      setEditingTimerId(id)
      const mins = Math.floor(timer.initialSeconds / 60)
      const secs = timer.initialSeconds % 60
      setEditingMinutes(mins)
      setEditingSeconds(secs)
    }
  }

  const saveEditTime = async (id: string) => {
    const totalSeconds = editingMinutes * 60 + editingSeconds
    if (totalSeconds <= 0) {
      alert('กรุณากรอกเวลาที่ถูกต้อง')
      return
    }

    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer => {
        if (timer.id === id) {
          return {
            ...timer,
            initialSeconds: totalSeconds,
            remainingSeconds: totalSeconds,
            status: timer.status === 'running' ? ('idle' as const) : timer.status
          }
        }
        return timer
      })
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
    setEditingTimerId(null)
  }

  const cancelEditTime = () => {
    setEditingTimerId(null)
  }

  const startEditName = (id: string) => {
    const timer = timers.find(t => t.id === id)
    if (timer) {
      setEditingNameId(id)
      setEditingName(timer.name)
    }
  }

  const saveEditName = async (id: string) => {
    if (!editingName.trim()) {
      alert('กรุณากรอกชื่อที่ถูกต้อง')
      return
    }

    setTimers(prevTimers => {
      const updated: Timer[] = prevTimers.map(timer => {
        if (timer.id === id) {
          return { ...timer, name: editingName.trim() }
        }
        return timer
      })
      const timer = updated.find(t => t.id === id)
      if (timer) saveTimerToDB(timer)
      return updated
    })
    setEditingNameId(null)
  }

  const cancelEditName = () => {
    setEditingNameId(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="app">
      <h1>ระบบนับเวลาถอยหลัง</h1>
      
      <div className="timer-form">
        <div className="form-group">
          <label>ชื่อ:</label>
          <input
            type="text"
            value={newTimerName}
            onChange={(e) => setNewTimerName(e.target.value)}
            placeholder="กรอกชื่อ"
          />
        </div>
        <div className="form-group">
          <label>เวลา:</label>
          <div className="time-input-group">
            <div className="time-input">
              <input
                type="number"
                min="0"
                value={newTimerMinutes}
                onChange={(e) => setNewTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
              />
              <span>นาที</span>
            </div>
            <div className="time-input">
              <input
                type="number"
                min="0"
                max="59"
                value={newTimerSeconds}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  setNewTimerSeconds(val)
                }}
                placeholder="0"
              />
              <span>วินาที</span>
            </div>
          </div>
        </div>
        <button onClick={createTimer} className="btn-create">
          สร้าง Timer
        </button>
      </div>

      <div className="timers-container">
        {timers.length === 0 ? (
          <p className="no-timers">ยังไม่มี Timer</p>
        ) : (
          timers.map(timer => (
            <div
              key={timer.id}
              className={`timer-card ${timer.status === 'finished' ? 'finished' : ''}`}
            >
              <div className="timer-header">
                {editingNameId === timer.id ? (
                  <div className="edit-name-form">
                    <div className="edit-name-input-group">
                      <label>ชื่อ:</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="กรอกชื่อ"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveEditName(timer.id)
                          } else if (e.key === 'Escape') {
                            cancelEditName()
                          }
                        }}
                      />
                    </div>
                    <div className="edit-time-buttons">
                      <button
                        onClick={() => saveEditName(timer.id)}
                        className="btn-save"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={cancelEditName}
                        className="btn-cancel-edit"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{timer.name}</h3>
                    <div className="header-buttons">
                      <button
                        onClick={() => startEditName(timer.id)}
                        className="btn-edit-name"
                        title="แก้ไขชื่อ"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => deleteTimer(timer.id)}
                        className="btn-delete"
                      >
                        ลบ
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="timer-display">
                {editingTimerId === timer.id ? (
                  <div className="edit-time-form">
                    <div className="edit-time-input-group">
                      <label>เวลา:</label>
                      <div className="time-input-group">
                        <div className="time-input">
                          <input
                            type="number"
                            min="0"
                            value={editingMinutes}
                            onChange={(e) => setEditingMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            autoFocus
                          />
                          <span>นาที</span>
                        </div>
                        <div className="time-input">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={editingSeconds}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                              setEditingSeconds(val)
                            }}
                            placeholder="0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEditTime(timer.id)
                              } else if (e.key === 'Escape') {
                                cancelEditTime()
                              }
                            }}
                          />
                          <span>วินาที</span>
                        </div>
                      </div>
                    </div>
                    <div className="edit-time-buttons">
                      <button
                        onClick={() => saveEditTime(timer.id)}
                        className="btn-save"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={cancelEditTime}
                        className="btn-cancel-edit"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="time">{formatTime(timer.remainingSeconds)}</span>
                    <span className="status">
                      {timer.status === 'idle' && 'พร้อมใช้งาน'}
                      {timer.status === 'running' && 'กำลังนับถอยหลัง...'}
                      {timer.status === 'paused' && 'หยุดชั่วคราว'}
                      {timer.status === 'finished' && 'หมดเวลา!'}
                    </span>
                    {(timer.status === 'idle' || timer.status === 'paused') && (
                      <button
                        onClick={() => startEditTime(timer.id)}
                        className="btn-edit-time"
                      >
                        แก้ไขเวลา
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="timer-controls">
                {timer.status === 'idle' && (
                  <button
                    onClick={() => startTimer(timer.id)}
                    className="btn-start"
                  >
                    Start
                  </button>
                )}
                
                {timer.status === 'running' && (
                  <>
                    <button
                      onClick={() => pauseTimer(timer.id)}
                      className="btn-pause"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => cancelTimer(timer.id)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </>
                )}
                
                {timer.status === 'paused' && (
                  <>
                    <button
                      onClick={() => resumeTimer(timer.id)}
                      className="btn-resume"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="btn-reset"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => cancelTimer(timer.id)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </>
                )}
                
                {timer.status === 'finished' && (
                  <button
                    onClick={() => resetTimer(timer.id)}
                    className="btn-reset"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
