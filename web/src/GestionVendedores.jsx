import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function GestionVendedores() {
  const [vendedores, setVendedores] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarVendedores()
  }, [])

  async function cargarVendedores() {
    setCargando(true)
    const { data, error } = await supabase
      .from('visits')
      .select('vendedor_email, result, amount')
      .not('vendedor_email', 'is', null)

    if (!error) {
      const resumen = {}
      data.forEach(v => {
        const email = v.vendedor_email
        if (!resumen[email]) {
          resumen[email] = { email, total: 0, ventas: 0, monto: 0 }
        }
        resumen[email].total++
        if (v.result === 'venta') {
          resumen[email].ventas++
          resumen[email].monto += v.amount || 0
        }
      })
      setVendedores(Object.values(resumen))
    }
    setCargando(false)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px' }}>Vendedores activos</h2>
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#854d0e', maxWidth: '260px' }}>
          Para agregar vendedores nuevos ve a Supabase → Authentication → Users → Add user
        </div>
      </div>

      {cargando ? (
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      ) : vendedores.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No hay vendedores con visitas registradas aún</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vendedores.map(v => (
            <div key={v.email} style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                  {v.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{v.email}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{v.total} visitas registradas</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>{v.ventas}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Ventas</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>${v.monto.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Monto</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GestionVendedores