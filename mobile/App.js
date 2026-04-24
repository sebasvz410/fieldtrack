import { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import { supabase } from './supabase'

export default function App() {
  const [pantalla, setPantalla] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [visitaForm, setVisitaForm] = useState({ cliente: '', resultado: '', monto: '', notas: '' })
  const [visitas, setVisitas] = useState([])
  const [cargando, setCargando] = useState(false)

  const esSupervisor = usuario?.email === 'supervisor@fieldtrack.com'

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
    if (!error) setVisitas(data)
    setCargando(false)
  }

  useEffect(() => {
    if (pantalla === 'resumen' && usuario) cargarVisitas()
  }, [pantalla])

  async function handleGuardarVisita() {
    if (!visitaForm.cliente || !visitaForm.resultado) {
      Alert.alert('Error', 'Cliente y resultado son obligatorios')
      return
    }
    setCargando(true)
    const { error } = await supabase.from('visits').insert([{
      cliente_nombre: visitaForm.cliente,
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
      setVisitaForm({ cliente: '', resultado: '', monto: '', notas: '' })
    }
    setCargando(false)
  }

  const totalVentas = visitas.filter(v => v.result === 'venta').reduce((s, v) => s + (v.amount || 0), 0)

  const colores = {
    venta: '#16a34a',
    cotizacion: '#2563eb',
    no_interesado: '#dc2626',
    otro: '#64748b'
  }

  if (pantalla === 'login') {
    return (
      <View style={styles.loginFondo}>
        <View style={styles.loginCard}>
          <Image source={require('./assets/logoveneto.png')} style={{ height: 60, width: '100%', resizeMode: 'contain', marginBottom: 12 }} />
          <Text style={styles.titulo}>FieldTrack</Text>
          <Text style={styles.subtitulo}>Veneto — Vendedores de campo</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={loginForm.email}
            onChangeText={t => setLoginForm({ ...loginForm, email: t })}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={loginForm.password}
            onChangeText={t => setLoginForm({ ...loginForm, password: t })}
            placeholder="••••••••"
            secureTextEntry
          />

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
        <Text style={styles.navUsuario}>{usuario.email.split('@')[0]}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, pantalla === 'visita' && styles.tabActivo]}
          onPress={() => setPantalla('visita')}
        >
          <Text style={[styles.tabTexto, pantalla === 'visita' && styles.tabTextoActivo]}>Nueva visita</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, pantalla === 'resumen' && styles.tabActivo]}
          onPress={() => setPantalla('resumen')}
        >
          <Text style={[styles.tabTexto, pantalla === 'resumen' && styles.tabTextoActivo]}>
            {esSupervisor ? 'Dashboard' : 'Mis visitas'}
          </Text>
        </TouchableOpacity>
      </View>

      {pantalla === 'visita' && (
        <ScrollView>
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Nueva visita</Text>
            <Text style={styles.vendedorTag}>{usuario.email}</Text>

            <Text style={styles.label}>Cliente *</Text>
            <TextInput
              style={styles.input}
              value={visitaForm.cliente}
              onChangeText={t => setVisitaForm({ ...visitaForm, cliente: t })}
              placeholder="Nombre del cliente"
            />

            <Text style={styles.label}>Resultado *</Text>
            <View style={styles.pilasRow}>
              {['venta', 'cotizacion', 'no_interesado', 'otro'].map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setVisitaForm({ ...visitaForm, resultado: r })}
                  style={[styles.pila, visitaForm.resultado === r && styles.pilaActiva]}
                >
                  <Text style={[styles.pilaTexto, visitaForm.resultado === r && styles.pilaTextoActivo]}>
                    {r === 'venta' ? 'Venta' : r === 'cotizacion' ? 'Cotización' : r === 'no_interesado' ? 'No interesado' : 'Otro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Monto (opcional)</Text>
            <TextInput
              style={styles.input}
              value={visitaForm.monto}
              onChangeText={t => setVisitaForm({ ...visitaForm, monto: t })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={visitaForm.notas}
              onChangeText={t => setVisitaForm({ ...visitaForm, notas: t })}
              placeholder="Detalles de la visita..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.btnPrimario} onPress={handleGuardarVisita} disabled={cargando}>
              <Text style={styles.btnPrimarioTexto}>{cargando ? 'Guardando...' : 'Guardar visita'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSalir} onPress={() => { supabase.auth.signOut(); setPantalla('login') }}>
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
                <Text style={styles.kpiLabel}>Total visitas</Text>
                <Text style={styles.kpiValor}>{visitas.length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Ventas</Text>
                <Text style={[styles.kpiValor, { color: '#16a34a' }]}>{visitas.filter(v => v.result === 'venta').length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Monto</Text>
                <Text style={[styles.kpiValor, { color: '#2563eb', fontSize: 16 }]}>${totalVentas.toLocaleString()}</Text>
              </View>
            </View>

            {cargando ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Cargando...</Text>
            ) : visitas.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No hay visitas registradas</Text>
            ) : (
              visitas.map(v => (
                <View key={v.id} style={styles.visitaCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visitaCliente}>{v.cliente_nombre || 'Sin cliente'}</Text>
                      {esSupervisor && <Text style={styles.visitaVendedor}>{v.vendedor_email}</Text>}
                      <Text style={styles.visitaFecha}>
                        {new Date(v.visited_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                      {v.notes ? <Text style={styles.visitaNotas}>{v.notes}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {v.amount ? <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14 }}>${v.amount.toLocaleString()}</Text> : null}
                      <View style={[styles.badge, { backgroundColor: (colores[v.result] || '#64748b') + '20' }]}>
                        <Text style={[styles.badgeTexto, { color: colores[v.result] || '#64748b' }]}>
                          {v.result || 'sin resultado'}
                        </Text>
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