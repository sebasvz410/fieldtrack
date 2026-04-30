import { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import { supabase } from './supabase'

export default function App() {
  const [pantalla, setPantalla] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [rol, setRol] = useState(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [verPassword, setVerPassword] = useState(false)
  const [visitaForm, setVisitaForm] = useState({ cliente: '', tipo_cliente: '', rubro: '', resultado: '', monto: '', notas: '' })
  const [visitas, setVisitas] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtroResultado, setFiltroResultado] = useState('todos')
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [mesActual, setMesActual] = useState(new Date())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const esSupervisor = rol === 'supervisor'
  const mesSiguienteDisabled = mesActual.getMonth() === new Date().getMonth() && mesActual.getFullYear() === new Date().getFullYear()

  async function cargarRol(email) {
    const { data, error } = await supabase
      .from('roles')
      .select('rol')
      .eq('email', email)
      .single()
    if (!error && data) setRol(data.rol)
    else setRol('vendor')
  }

  async function handleLogin() {
    setCargando(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    })
    if (error) {
      Alert.alert('Error', 'Email o contraseña incorrectos')
    } else {
      setUsuario(data.user)
      await cargarRol(data.user.email)
      setPantalla('visita')
    }
    setCargando(false)
  }

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

  useEffect(() => {
    if (pantalla === 'resumen' && usuario) cargarVisitas()
  }, [pantalla])

  function parsearFecha(str) {
    if (!str || str.length !== 10) return null
    const [dia, mes, anio] = str.split('/')
    if (!dia || !mes || !anio) return null
    const fecha = new Date(`${anio}-${mes}-${dia}`)
    return isNaN(fecha.getTime()) ? null : fecha
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function dentroDelRango(fecha) {
    const f = new Date(fecha)
    const hoy = new Date()
    if (filtroFecha === 'hoy') return f.toDateString() === hoy.toDateString()
    if (filtroFecha === 'semana') {
      const hace7 = new Date()
      hace7.setDate(hoy.getDate() - 7)
      return f >= hace7
    }
    if (filtroFecha === 'mes') {
      return f.getMonth() === mesActual.getMonth() && f.getFullYear() === mesActual.getFullYear()
    }
    if (filtroFecha === 'rango') {
      const desde = parsearFecha(fechaDesde)
      const hasta = parsearFecha(fechaHasta)
      if (desde && f < desde) return false
      if (hasta) {
        const hastaFin = new Date(hasta)
        hastaFin.setHours(23, 59, 59)
        if (f > hastaFin) return false
      }
      return true
    }
    return true
  }

  async function handleGuardarVisita() {
    if (!visitaForm.cliente || !visitaForm.resultado || !visitaForm.tipo_cliente || !visitaForm.rubro) {
      Alert.alert('Error', 'Cliente, tipo, rubro y resultado son obligatorios')
      return
    }
    setCargando(true)
    const { error } = await supabase.from('visits').insert([{
      cliente_nombre: visitaForm.cliente,
      tipo_cliente: visitaForm.tipo_cliente,
      rubro: visitaForm.rubro,
      result: visitaForm.resultado,
      amount: visitaForm.monto ? parseFloat(visitaForm.monto) : null,
      notes: visitaForm.notas,
      vendedor_email: usuario.email,
      visited_at: new Date().toISOString()
    }])
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Listo', 'Visita registrada correctamente')
      setVisitaForm({ cliente: '', tipo_cliente: '', rubro: '', resultado: '', monto: '', notas: '' })
    }
    setCargando(false)
  }

  const visitasFiltradas = visitas
    .filter(v => filtroResultado === 'todos' || v.result === filtroResultado)
    .filter(v => filtroTipoCliente === 'todos' || v.tipo_cliente === filtroTipoCliente)
    .filter(v => filtroVendedor === 'todos' || v.vendedor_email === filtroVendedor)
    .filter(v => dentroDelRango(v.visited_at))

  const totalVentas = visitasFiltradas.filter(v => v.result === 'venta').reduce((s, v) => s + (parseFloat(v.amount) || 0), 0)

  const colores = {
    venta: '#16a34a',
    cotizacion: '#2563eb',
    no_interesado: '#dc2626',
    otro: '#64748b'
  }

  const Selector = ({ label, opciones, valor, onChange }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pilasRow}>
        {opciones.map(op => (
          <TouchableOpacity key={op.value} onPress={() => onChange(op.value)} style={[styles.pila, valor === op.value && styles.pilaActiva]}>
            <Text style={[styles.pilaTexto, valor === op.value && styles.pilaTextoActivo]}>{op.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const FiltroRow = ({ label, opciones, valor, onChange, color }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {opciones.map(op => (
            <TouchableOpacity key={op.value} onPress={() => onChange(op.value)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: valor === op.value ? color : '#f3f4f6' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: valor === op.value ? 'white' : '#374151' }}>{op.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )

  if (pantalla === 'login') {
    return (
      <View style={styles.loginFondo}>
        <View style={styles.loginCard}>
          <Image source={require('./assets/logoveneto.png')} style={{ height: 60, width: '100%', resizeMode: 'contain', marginBottom: 12 }} />
          <Text style={styles.titulo}>FieldTrack</Text>
          <Text style={styles.subtitulo}>Veneto — Vendedores de campo</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={loginForm.email} onChangeText={t => setLoginForm({ ...loginForm, email: t })} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Contraseña</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 44 }]} value={loginForm.password} onChangeText={t => setLoginForm({ ...loginForm, password: t })} placeholder="••••••••" secureTextEntry={!verPassword} />
            <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={{ position: 'absolute', right: 12, top: 11 }}>
              <Text style={{ fontSize: 18 }}>{verPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnPrimario} onPress={handleLogin} disabled={cargando}>
            <Text style={styles.btnPrimarioTexto}>{cargando ? 'Entrando...' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <View style={styles.navbar}>
        <Image source={require('./assets/logoveneto.png')} style={{ height: 30, width: 100, resizeMode: 'contain' }} />
        <Text style={styles.navUsuario}>{usuario.email.split('@')[0]} · {esSupervisor ? 'Supervisor' : 'Vendedor'}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, pantalla === 'visita' && styles.tabActivo]} onPress={() => setPantalla('visita')}>
          <Text style={[styles.tabTexto, pantalla === 'visita' && styles.tabTextoActivo]}>Nueva visita</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, pantalla === 'resumen' && styles.tabActivo]} onPress={() => setPantalla('resumen')}>
          <Text style={[styles.tabTexto, pantalla === 'resumen' && styles.tabTextoActivo]}>{esSupervisor ? 'Dashboard' : 'Mis visitas'}</Text>
        </TouchableOpacity>
      </View>

      {pantalla === 'visita' && (
        <ScrollView>
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Nueva visita</Text>
            <Text style={styles.vendedorTag}>{usuario.email}</Text>
            <Text style={styles.label}>Cliente *</Text>
            <TextInput style={styles.input} value={visitaForm.cliente} onChangeText={t => setVisitaForm({ ...visitaForm, cliente: t })} placeholder="Nombre del cliente" />
            <Selector label="Tipo de cliente *" valor={visitaForm.tipo_cliente} onChange={v => setVisitaForm({ ...visitaForm, tipo_cliente: v })} opciones={[{ value: 'nuevo', label: 'Nuevo' }, { value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'potencial', label: 'Potencial' }]} />
            <Selector label="Rubro *" valor={visitaForm.rubro} onChange={v => setVisitaForm({ ...visitaForm, rubro: v })} opciones={[{ value: 'kiosco', label: 'Kiosco' }, { value: 'maxikiosco', label: 'Maxikiosco' }, { value: 'drugstore', label: 'Drugstore' }, { value: 'almacen', label: 'Almacén' }, { value: 'minimercado', label: 'Minimercado' }, { value: 'mercado', label: 'Mercado' }, { value: 'supermercado', label: 'Supermercado' }, { value: 'distribuidor', label: 'Distribuidor' }, { value: 'gastronomico', label: 'Gastronómico' }, { value: 'otros', label: 'Otros' }]} />
            <Selector label="Resultado *" valor={visitaForm.resultado} onChange={v => setVisitaForm({ ...visitaForm, resultado: v })} opciones={[{ value: 'venta', label: 'Venta' }, { value: 'cotizacion', label: 'Cotización' }, { value: 'no_interesado', label: 'No interesado' }, { value: 'otro', label: 'Otro' }]} />
            <Text style={styles.label}>Monto (opcional)</Text>
            <TextInput style={styles.input} value={visitaForm.monto} onChangeText={t => setVisitaForm({ ...visitaForm, monto: t })} placeholder="0.00" keyboardType="numeric" />
            <Text style={styles.label}>Notas</Text>
            <TextInput style={[styles.input, styles.textarea]} value={visitaForm.notas} onChangeText={t => setVisitaForm({ ...visitaForm, notas: t })} placeholder="Detalles de la visita..." multiline numberOfLines={4} />
            <TouchableOpacity style={styles.btnPrimario} onPress={handleGuardarVisita} disabled={cargando}>
              <Text style={styles.btnPrimarioTexto}>{cargando ? 'Guardando...' : 'Guardar visita'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSalir} onPress={() => { supabase.auth.signOut(); setPantalla('login'); setUsuario(null); setRol(null) }}>
              <Text style={styles.btnSalirTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {pantalla === 'resumen' && (
        <ScrollView>
          <View style={{ padding: 16 }}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Visitas</Text>
                <Text style={styles.kpiValor}>{visitasFiltradas.length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Ventas</Text>
                <Text style={[styles.kpiValor, { color: '#16a34a' }]}>{visitasFiltradas.filter(v => v.result === 'venta').length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Monto</Text>
                <Text style={[styles.kpiValor, { color: '#2563eb', fontSize: 16 }]}>${totalVentas.toLocaleString()}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12, elevation: 1 }}>
              <FiltroRow
                label="Fecha"
                valor={filtroFecha}
                onChange={setFiltroFecha}
                color="#dc2626"
                opciones={[{ value: 'todos', label: 'Todas' }, { value: 'hoy', label: 'Hoy' }, { value: 'semana', label: 'Últimos 7 días' }, { value: 'mes', label: 'Por mes' }, { value: 'rango', label: 'Rango' }]}
              />

              {filtroFecha === 'mes' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => { const m = new Date(mesActual); m.setMonth(m.getMonth() - 1); setMesActual(m) }} style={{ padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white' }}>
                    <Text style={{ fontSize: 18, color: '#374151' }}>‹</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', minWidth: 150, textAlign: 'center' }}>
                    {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                  </Text>
                  <TouchableOpacity onPress={() => { if (!mesSiguienteDisabled) { const m = new Date(mesActual); m.setMonth(m.getMonth() + 1); setMesActual(m) } }} style={{ padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white', opacity: mesSiguienteDisabled ? 0.3 : 1 }}>
                    <Text style={{ fontSize: 18, color: '#374151' }}>›</Text>
                  </TouchableOpacity>
                </View>
              )}

              {filtroFecha === 'rango' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Formato: DD/MM/AAAA</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Desde</Text>
                      <TextInput style={[styles.input, { fontSize: 13, padding: 8 }]} value={fechaDesde} onChangeText={setFechaDesde} placeholder="01/04/2026" keyboardType="numeric" maxLength={10} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Hasta</Text>
                      <TextInput style={[styles.input, { fontSize: 13, padding: 8 }]} value={fechaHasta} onChangeText={setFechaHasta} placeholder="30/04/2026" keyboardType="numeric" maxLength={10} />
                    </View>
                  </View>
                </View>
              )}

              {esSupervisor && vendedores.length > 0 && (
                <FiltroRow label="Vendedor" valor={filtroVendedor} onChange={setFiltroVendedor} color="#2563eb" opciones={[{ value: 'todos', label: 'Todos' }, ...vendedores.map(v => ({ value: v, label: v.split('@')[0] }))]} />
              )}
              <FiltroRow label="Tipo de cliente" valor={filtroTipoCliente} onChange={setFiltroTipoCliente} color="#7c3aed" opciones={[{ value: 'todos', label: 'Todos' }, { value: 'nuevo', label: 'Nuevo' }, { value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'potencial', label: 'Potencial' }]} />
              <FiltroRow label="Resultado" valor={filtroResultado} onChange={setFiltroResultado} color="#0f766e" opciones={[{ value: 'todos', label: 'Todos' }, { value: 'venta', label: 'Venta' }, { value: 'cotizacion', label: 'Cotización' }, { value: 'no_interesado', label: 'No interesado' }, { value: 'otro', label: 'Otro' }]} />
            </View>

            {cargando ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Cargando...</Text>
            ) : visitasFiltradas.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No hay visitas para este filtro</Text>
            ) : (
              visitasFiltradas.map(v => (
                <View key={v.id} style={styles.visitaCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visitaCliente}>{v.cliente_nombre || 'Sin cliente'}</Text>
                      {esSupervisor && <Text style={styles.visitaVendedor}>{v.vendedor_email}</Text>}
                      {v.tipo_cliente && <Text style={{ fontSize: 11, color: '#7c3aed', marginBottom: 1 }}>{v.tipo_cliente} · {v.rubro}</Text>}
                      <Text style={styles.visitaFecha}>{formatFecha(v.visited_at)}</Text>
                      {v.notes ? <Text style={styles.visitaNotas}>{v.notes}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {v.amount ? <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14 }}>${parseFloat(v.amount).toLocaleString()}</Text> : null}
                      <View style={[styles.badge, { backgroundColor: (colores[v.result] || '#64748b') + '20' }]}>
                        <Text style={[styles.badgeTexto, { color: colores[v.result] || '#64748b' }]}>{v.result || 'sin resultado'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  loginFondo: { flex: 1, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { backgroundColor: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 },
  titulo: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 4, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#64748b', marginBottom: 28, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 11, fontSize: 14, backgroundColor: 'white' },
  textarea: { height: 100, textAlignVertical: 'top' },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, marginTop: 20, alignItems: 'center' },
  btnPrimarioTexto: { color: 'white', fontWeight: '600', fontSize: 15 },
  btnSalir: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginTop: 10, alignItems: 'center' },
  btnSalirTexto: { color: '#64748b', fontSize: 14 },
  navbar: { backgroundColor: '#1e40af', padding: 16, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navUsuario: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActivo: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabTexto: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  tabTextoActivo: { color: '#2563eb', fontWeight: '600' },
  card: { margin: 16, backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 2 },
  cardTitulo: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  vendedorTag: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  pilasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pila: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  pilaActiva: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pilaTexto: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  pilaTextoActivo: { color: 'white' },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 14, alignItems: 'center', elevation: 1 },
  kpiLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  kpiValor: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  visitaCard: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  visitaCliente: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  visitaVendedor: { fontSize: 12, color: '#2563eb', marginBottom: 2 },
  visitaFecha: { fontSize: 12, color: '#64748b' },
  visitaNotas: { fontSize: 12, color: '#374151', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  badgeTexto: { fontSize: 11, fontWeight: '600' }
})