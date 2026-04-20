import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function DashboardSupervisor({ usuario }) {
  const [visitas, setVisitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  const esSupervisor = usuario.email === 'supervisor@fieldtrack.com'

  useEffect(() => {
    cargarVisitas()
  }, [])

  async function cargarVisitas() {
    setCargando(true)

    let query = supabase
      .from('visits')
      .select('*')
      .order('visited_at', { ascending: false })

    if (!esSupervisor) {
      query = query.eq('vendedor_email', usuario.email)
    }

    const { data, error } = await query
    if (!error) setVisitas(data)
    setCargando(false)
  }

  const visitasFiltradas = filtro === 'todos'
    ? visitas
    : visitas.filter(v => v.result === filtro)

  const totalVentas = visitas
    .filter(v => v.result === 'venta')
    .reduce((sum, v) => sum + (v.amount || 0), 0)

  const colores = {
    venta: { bg: '#dcfce7', color: '#16a34a' },
    cotizacion: { bg: '#dbeafe', color: '#2563eb' },
    no_interesado: { bg: '#fee2e2', color: '#dc2626' },
    otro: { bg: '#f3f4f6', color: '#6b7280' }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px' }}>
          {esSupervisor ? 'Dashboard del supervisor' : 'Mis visitas'}
        </h2>
        {esSupervisor && (
          <span style={{ fontSize: '12px', padding: '4px 12px', background: '#dbeafe', color: '#2563eb', borderRadius: '20px', fontWeight: '500' }}>
            Vista supervisor
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total visitas</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{visitas.length}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ventas</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>
            {visitas.filter(v => v.result === 'venta').length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Monto total</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>
            ${totalVentas.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['todos', 'venta', 'cotizacion', 'no_interesado', 'otro'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: filtro === f ? '#2563eb' : '#f3f4f6', color: filtro === f ? 'white' : '#374151' }}
            >
              {f === 'todos' ? 'Todos' : f === 'venta' ? 'Ventas' : f === 'cotizacion' ? 'Cotizaciones' : f === 'no_interesado' ? 'No interesados' : 'Otros'}
            </button>
          ))}
        </div>

        {cargando ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Cargando visitas...</p>
        ) : visitasFiltradas.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No hay visitas registradas</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visitasFiltradas.map(visita => (
              <div key={visita.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                      {visita.cliente_nombre || 'Sin cliente'}
                    </div>
                    {esSupervisor && (
                      <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '2px' }}>
                        {visita.vendedor_email || 'Sin vendedor'}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(visita.visited_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {visita.notes && (
                      <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
                        {visita.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {visita.amount && (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>
                        ${visita.amount.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: colores[visita.result]?.bg || '#f3f4f6', color: colores[visita.result]?.color || '#6b7280' }}>
                      {visita.result || 'sin resultado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardSupervisor