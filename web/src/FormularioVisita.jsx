import { useState } from 'react'
import { supabase } from './supabase'

function FormularioVisita({ usuario }) {
  const [form, setForm] = useState({
    cliente: '',
    resultado: '',
    monto: '',
    notas: ''
  })
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    const { error } = await supabase.from('visits').insert([{
      notes: form.notas,
      result: form.resultado,
      amount: form.monto ? parseFloat(form.monto) : null,
      visited_at: new Date().toISOString(),
      vendedor_email: usuario.email,
      cliente_nombre: form.cliente
    }])

    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje('Visita registrada correctamente!')
      setForm({ cliente: '', resultado: '', monto: '', notas: '' })
    }
    setCargando(false)
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Nueva visita</h2>
      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Vendedor: {usuario.email}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Cliente *</label>
          <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Resultado *</label>
          <select name="resultado" value={form.resultado} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
            <option value="">Seleccionar...</option>
            <option value="venta">Venta</option>
            <option value="cotizacion">Cotización</option>
            <option value="no_interesado">No interesado</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Monto (opcional)</label>
          <input name="monto" value={form.monto} onChange={handleChange} placeholder="0.00" type="number" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} placeholder="Detalles de la visita..." rows={4} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={cargando} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>
          {cargando ? 'Guardando...' : 'Guardar visita'}
        </button>
      </form>

      {mensaje && (
        <div style={{ marginTop: '16px', padding: '12px', background: mensaje.includes('Error') ? '#fee2e2' : '#dcfce7', borderRadius: '6px', color: mensaje.includes('Error') ? '#dc2626' : '#16a34a' }}>
          {mensaje}
        </div>
      )}
    </div>
  )
}

export default FormularioVisita