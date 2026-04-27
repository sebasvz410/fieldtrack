import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

function DashboardSupervisor({ usuario }) {
  const [visitas, setVisitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroResultado, setFiltroResultado] = useState('todos')
  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('todos')
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('todos')
  const [vendedores, setVendedores] = useState([])

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
    if (!error) {
      setVisitas(data)
      const emails = [...new Set(data.map(v => v.vendedor_email).filter(Boolean))]
      setVendedores(emails)
    }
    setCargando(false)
  }

  function dentroDelRango(fecha) {
    if (filtroFecha === 'todos') return true
    const hoy = new Date()
    const f = new Date(fecha)
    if (filtroFecha === 'hoy') return f.toDateString() === hoy.toDateString()
    if (filtroFecha === 'semana') {
      const hace7 = new Date()
      hace7.setDate(hoy.getDate() - 7)
      return f >= hace7
    }
    if (filtroFecha === 'mes') return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    return true
  }

  function exportarExcel() {
    const datos = visitasFiltradas.map(v => ({
      'Cliente': v.cliente_nombre || 'Sin cliente',
      'Tipo de cliente': v.tipo_cliente || '',
      'Rubro': v.rubro || '',
      'Vendedor': v.vendedor_email || 'Sin vendedor',
      'Resultado': v.result || 'Sin resultado',
      'Monto': v.amount || 0,
      'Notas': v.notes || '',
      'Fecha': new Date(v.visited_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }))

    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Visitas')
    XLSX.writeFile(libro, 'visitas_fieldtrack.xlsx')
  }

  const visitasFiltradas = visitas
    .filter(v => filtroResultado === 'todos' || v.result === filtroResultado)
    .filter(v => filtroVendedor === 'todos' || v.vendedor_email === filtroVendedor)
    .filter(v => filtroTipoCliente === 'todos' || v.tipo_cliente === filtroTipoCliente)
    .filter(v => dentroDelRango(v.visited_at))

  const totalVentas = visitasFiltradas
    .filter(v => v.result === 'venta')
    .reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0)

  const colores = {
    venta: { bg: '#dcfce7', color: '#16a34a' },
    cotizacion: { bg: '#dbeafe', color: '#2563eb' },
    no_interesado: { bg: '#fee2e2', color: '#dc2626' },
    otro: { bg: '#f3f4f6', color: '#6b7280' }
  }

  const btnFecha = (val, label) => (
    <button
      onClick={() => setFiltroFecha(val)}
      style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filtroFecha === val ? '#dc2626' : '#f3f4f6', color: filtroFecha === val ? 'white' : '#374151' }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px' }}>
          {esSupervisor ? 'Dashboard del supervisor' : 'Mis visitas'}
        </h2>
        {esSupervisor && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', padding: '4px 12px', background: '#dbeafe', color: '#2563eb', borderRadius: '20px', fontWeight: '500' }}>
              Vista supervisor
            </span>
            <button
              onClick={exportarExcel}
              style={{ fontSize: '12px', padding: '6px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Exportar Excel
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Visitas filtradas</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{visitasFiltradas.length}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ventas</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>
            {visitasFiltradas.filter(v => v.result === 'venta').length}
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

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Filtrar por fecha</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {btnFecha('todos', 'Todas')}
            {btnFecha('hoy', 'Hoy')}
            {btnFecha('semana', 'Últimos 7 días')}
            {btnFecha('mes', 'Este mes')}
          </div>
        </div>

        {esSupervisor && vendedores.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Filtrar por vendedor</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFiltroVendedor('todos')}
                style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filtroVendedor === 'todos' ? '#2563eb' : '#f3f4f6', color: filtroVendedor === 'todos' ? 'white' : '#374151' }}
              >
                Todos
              </button>
              {vendedores.map(v => (
                <button
                  key={v}
                  onClick={() => setFiltroVendedor(v)}
                  style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filtroVendedor === v ? '#2563eb' : '#f3f4f6', color: filtroVendedor === v ? 'white' : '#374151' }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Filtrar por tipo de cliente</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['todos', 'nuevo', 'activo', 'inactivo', 'potencial'].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipoCliente(t)}
                style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filtroTipoCliente === t ? '#7c3aed' : '#f3f4f6', color: filtroTipoCliente === t ? 'white' : '#374151' }}
              >
                {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Filtrar por resultado</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['todos', 'venta', 'cotizacion', 'no_interesado', 'otro'].map(f => (
              <button
                key={f}
                onClick={() => setFiltroResultado(f)}
                style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filtroResultado === f ? '#0f766e' : '#f3f4f6', color: filtroResultado === f ? 'white' : '#374151' }}
              >
                {f === 'todos' ? 'Todos' : f === 'venta' ? 'Ventas' : f === 'cotizacion' ? 'Cotizaciones' : f === 'no_interesado' ? 'No interesados' : 'Otros'}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Cargando visitas...</p>
        ) : visitasFiltradas.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No hay visitas para este filtro</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visitasFiltradas.map(visita => (
              <div key={visita.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                      {visita.cliente_nombre || 'Sin cliente'}
                    </div>
                    {visita.tipo_cliente && (
                      <div style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '2px' }}>
                        {visita.tipo_cliente.charAt(0).toUpperCase() + visita.tipo_cliente.slice(1)} · {visita.rubro}
                      </div>
                    )}
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
                        ${parseFloat(visita.amount).toLocaleString()}
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