import { useState } from 'react'
import { supabase } from './supabase'

function FormularioVisita({ usuario }) {
  const [form, setForm] = useState({
    cliente: '',
    tipo_cliente: '',
    rubro: '',
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
      cliente_nombre: form.cliente,
      tipo_cliente: form.tipo_cliente,
      rubro: form.rubro
    }])

    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje('Visita registrada correctamente!')
      setForm({ cliente: '', tipo_cliente: '', rubro: '', resultado: '', monto: '', notas: '' })
    }
    setCargando(false)
  }

  const inputStyle = { width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px', color: '#374151' }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '4px', color: '#1e293b' }}>Nueva visita</h2>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Vendedor: {usuario.email}</p>

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Cliente *</label>
          <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente" required style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo de cliente *</label>
          <select name="tipo_cliente" value={form.tipo_cliente} onChange={handleChange} required style={inputStyle}>
            <option value="">Seleccionar...</option>
            <option value="nuevo">Cliente nuevo</option>
            <option value="activo">Cliente activo</option>
            <option value="inactivo">Cliente inactivo</option>
            <option value="potencial">Potencial</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Rubro *</label>
          <select name="rubro" value={form.rubro} onChange={handleChange} required style={inputStyle}>
            <option value="">Seleccionar...</option>
            <option value="kiosco">Kiosco</option>
            <option value="maxikiosco">Maxikiosco</option>
            <option value="drugstore">Drugstore</option>
            <option value="almacen">Almacén</option>
            <option value="minimercado">Minimercado</option>
            <option value="mercado">Mercado</option>
            <option value="supermercado">Supermercado</option>
            <option value="distribuidor">Distribuidor</option>
            <option value="gastronomico">Gastronómico</option>
            <option value="heladeria">Heladería</option>
            <option value="escuela">Escuela</option>
            <option value="club">Club</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Resultado *</label>
          <select name="resultado" value={form.resultado} onChange={handleChange} required style={inputStyle}>
            <option value="">Seleccionar...</option>
            <option value="venta">Venta</option>
            <option value="cotizacion">Cotización</option>
            <option value="no_interesado">No interesado</option>
            <option value="tiene_mercaderia">Tiene mercadería</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Monto (opcional)</label>
          <input name="monto" value={form.monto} onChange={handleChange} placeholder="0.00" type="number" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} placeholder="Detalles de la visita..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={cargando} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          {cargando ? 'Guardando...' : 'Guardar visita'}
        </button>
      </form>

      {mensaje && (
        <div style={{ marginTop: '16px', padding: '12px', background: mensaje.includes('Error') ? '#fef2f2' : '#dcfce7', borderRadius: '8px', color: mensaje.includes('Error') ? '#dc2626' : '#16a34a', fontSize: '13px' }}>
          {mensaje}
        </div>
      )}
    </div>
  )
}

export default FormularioVisita