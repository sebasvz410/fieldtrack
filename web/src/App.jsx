import { useState } from 'react'
import { supabase } from './supabase'
import FormularioVisita from './FormularioVisita'
import DashboardSupervisor from './DashboardSupervisor'

function App() {
  const [pantalla, setPantalla] = useState('formulario')

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
      </nav>

      <div style={{ padding: '24px' }}>
        {pantalla === 'formulario' && <FormularioVisita />}
        {pantalla === 'dashboard' && <DashboardSupervisor />}
      </div>
    </div>
  )
}

export default App