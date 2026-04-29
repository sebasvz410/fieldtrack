import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import FormularioVisita from './FormularioVisita'
import DashboardSupervisor from './DashboardSupervisor'
import GestionVendedores from './GestionVendedores'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [rol, setRol] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pantalla, setPantalla] = useState('formulario')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario(session.user)
        cargarRol(session.user.email)
      } else {
        setCargando(false)
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuario(session.user)
        cargarRol(session.user.email)
      } else {
        setUsuario(null)
        setRol(null)
      }
    })
  }, [])

  async function cargarRol(email) {
    const { data, error } = await supabase
      .from('roles')
      .select('rol, nombre')
      .eq('email', email)
      .single()

    if (!error && data) {
      setRol(data.rol)
    } else {
      setRol('vendor')
    }
    setCargando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUsuario(null)
    setRol(null)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logoveneto.png" alt="Veneto" style={{ height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
        <p style={{ color: '#64748b' }}>Cargando...</p>
      </div>
    </div>
  )

  if (!usuario) return <Login onLogin={(user) => { setUsuario(user); cargarRol(user.email) }} />

  const esSupervisor = rol === 'supervisor'

  const navItems = [
    { id: 'formulario', label: 'Nueva visita' },
    { id: 'dashboard', label: 'Dashboard' },
    ...(esSupervisor ? [{ id: 'vendedores', label: 'Vendedores' }] : [])
  ]

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: '#f1f5f9' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', alignItems: 'center', height: '60px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
          <img src="/logoveneto.png" alt="Veneto" style={{ height: '36px', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPantalla(item.id)}
              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px', background: pantalla === item.id ? '#eff6ff' : 'transparent', color: pantalla === item.id ? '#2563eb' : '#64748b' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: esSupervisor ? '#fef3c7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: esSupervisor ? '#d97706' : '#2563eb' }}>
              {usuario.email[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{usuario.email.split('@')[0]}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{esSupervisor ? 'Supervisor' : 'Vendedor'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ padding: '6px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#64748b', fontWeight: '500' }}
          >
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '28px 24px' }}>
        {pantalla === 'formulario' && <FormularioVisita usuario={usuario} />}
        {pantalla === 'dashboard' && <DashboardSupervisor usuario={usuario} rol={rol} />}
        {pantalla === 'vendedores' && esSupervisor && <GestionVendedores />}
      </div>
    </div>
  )
}

export default App