import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import FormularioVisita from './FormularioVisita'
import DashboardSupervisor from './DashboardSupervisor'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pantalla, setPantalla] = useState('formulario')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      Cargando...
    </div>
  )

  if (!usuario) return <Login onLogin={setUsuario} />

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ background: '#2563eb', padding: '12px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginRight: '24px' }}>FieldTrack</span>
        <button
          onClick={() => setPantalla('formulario')}
          style={{ background: pantalla === 'formulario' ? 'white' : 'transparent', color: pantalla === 'formulario' ? '#2563eb' : 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
        >
          Nueva visita
        </button>
        <button
          onClick={() => setPantalla('dashboard')}
          style={{ background: pantalla === 'dashboard' ? 'white' : 'transparent', color: pantalla === 'dashboard' ? '#2563eb' : 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
        >
          Dashboard
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'white', fontSize: '13px' }}>{usuario.email}</span>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>
        {pantalla === 'formulario' && <FormularioVisita usuario={usuario} />}
        {pantalla === 'dashboard' && <DashboardSupervisor usuario={usuario} />}
      </div>
    </div>
  )
}

export default App