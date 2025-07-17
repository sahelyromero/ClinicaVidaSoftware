// calendarioAux.ts - VERSIÓN CON DEBUG MEJORADO

import { getEventosByDoctor, getDoctors } from '../../database/db'
import type { EventoEspecial, Doctor } from '../../database/db'
import type { Medico } from './calendario-func'

// CORREGIDO: Función para crear fecha sin zona horaria (acepta string o Date)
const crearFechaSinZonaHoraria = (fechaInput: string | Date): Date => {
  // Si la fecha viene como string (ej: "2024-07-23"), crear fecha local
  if (typeof fechaInput === 'string') {
    const [year, month, day] = fechaInput.split('-').map(Number)
    return new Date(year, month - 1, day) // mes - 1 porque Date usa base 0
  }

  // Si ya es Date, verificar si tiene zona horaria
  const fecha = new Date(fechaInput)
  // Si tiene zona horaria, convertir a fecha local
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

// Función para obtener el símbolo del evento
const obtenerSimboloEvento = (tipo: EventoEspecial['type']): string => {
  switch (tipo) {
    case 'vacaciones':
      return 'V'
    case 'dia_familia':
      return 'A'
    case 'calamidad':
      return 'K'
    case 'permiso_personal':
      return 'P'
    case 'incapacidad':
      return 'I'
    default:
      return ''
  }
}

// Función para aplicar cumpleaños
const aplicarCumpleanos = (
  doctor: Doctor,
  turnos: Record<number, string>,
  mes: number
): void => {
  const fechaNacimiento = crearFechaSinZonaHoraria(doctor.birthDate)
  if (fechaNacimiento.getMonth() === mes) {
    const dia = fechaNacimiento.getDate()
    turnos[dia] = 'C4'
    console.log(`✓ Cumpleaños aplicado: Doctor ${doctor.name} día ${dia}`)
  }
}

// CORREGIDO: Función para verificar si un evento aplica en el mes
const eventoAplicaEnMes = (evento: EventoEspecial, mes: number, año: number): boolean => {
  const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
  const mesEvento = fechaInicio.getMonth()
  const añoEvento = fechaInicio.getFullYear()

  // Debug detallado
  console.log(`🔍 Verificando evento ${evento.type}:`)
  console.log(`   - Fecha evento: ${evento.fechaInicio} -> ${fechaInicio.toDateString()}`)
  console.log(`   - Mes evento: ${mesEvento} vs Mes buscado: ${mes}`)
  console.log(`   - Año evento: ${añoEvento} vs Año buscado: ${año}`)

  if (evento.type === 'vacaciones' && evento.fechaFin) {
    const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)
    const inicioMes = new Date(año, mes, 1)
    const finMes = new Date(año, mes + 1, 0)

    const aplica = (fechaInicio <= finMes && fechaFin >= inicioMes)
    console.log(`   - Vacaciones del ${fechaInicio.toDateString()} al ${fechaFin.toDateString()}`)
    console.log(`   - Mes va del ${inicioMes.toDateString()} al ${finMes.toDateString()}`)
    console.log(`   - ¿Aplica?: ${aplica}`)
    return aplica
  } else {
    // Otros eventos aplican solo si están en el mes específico
    const aplica = mesEvento === mes && añoEvento === año
    console.log(`   - ¿Aplica?: ${aplica}`)
    return aplica
  }
}

// CORREGIDO: Función para aplicar un evento a los turnos con mejor debug
const aplicarEventoATurnos = (
  evento: EventoEspecial,
  turnos: Record<number, string>,
  mes: number,
  año: number
): void => {
  const simbolo = obtenerSimboloEvento(evento.type)
  if (!simbolo) {
    console.log(`❌ No se pudo obtener símbolo para evento tipo: ${evento.type}`)
    return
  }

  console.log(`📝 Aplicando evento ${simbolo} (${evento.type})`)

  if (evento.type === 'vacaciones' && evento.fechaFin) {
    // Para vacaciones, aplicar a todos los días del rango
    const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
    const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)

    console.log(`   - Vacaciones del ${fechaInicio.toDateString()} al ${fechaFin.toDateString()}`)

    // Crear fecha actual para iterar
    const fechaActual = new Date(fechaInicio)
    let diasAplicados = 0

    while (fechaActual <= fechaFin) {
      if (fechaActual.getMonth() === mes && fechaActual.getFullYear() === año) {
        const dia = fechaActual.getDate()
        const turnoAnterior = turnos[dia]
        turnos[dia] = simbolo
        console.log(`   - Día ${dia}: ${turnoAnterior || 'vacío'} -> ${simbolo}`)
        diasAplicados++
      }
      fechaActual.setDate(fechaActual.getDate() + 1)
    }
    console.log(`   - Total días aplicados: ${diasAplicados}`)
  } else {
    // Para otros eventos de un solo día
    const fechaEvento = crearFechaSinZonaHoraria(evento.fechaInicio)
    console.log(`   - Fecha del evento: ${fechaEvento.toDateString()}`)
    console.log(`   - Mes del evento: ${fechaEvento.getMonth()} vs Mes objetivo: ${mes}`)
    console.log(`   - Año del evento: ${fechaEvento.getFullYear()} vs Año objetivo: ${año}`)

    if (fechaEvento.getMonth() === mes && fechaEvento.getFullYear() === año) {
      const dia = fechaEvento.getDate()
      const turnoAnterior = turnos[dia]
      turnos[dia] = simbolo
      console.log(`   ✓ Día ${dia}: ${turnoAnterior || 'vacío'} -> ${simbolo}`)
    } else {
      console.log(`   ❌ Evento no aplica para el mes ${mes + 1}/${año}`)
    }
  }
}

// Función principal para aplicar eventos especiales (con mejor debug)
export const aplicarEventosEspeciales = async (
  medicos: Medico[],
  mes: number,
  año: number
): Promise<Medico[]> => {
  try {
    console.log(`\n🚀 ===== APLICANDO EVENTOS ESPECIALES PARA ${mes + 1}/${año} =====`)

    // Obtener todos los doctores una sola vez
    const doctores = await getDoctors()
    console.log(`📋 Doctores en BD: ${doctores.length}`)

    // Crear mapa de doctores por ID para acceso rápido
    const doctoresMap = new Map<number, Doctor>()
    doctores.forEach(doctor => {
      if (doctor.id) {
        doctoresMap.set(doctor.id, doctor)
      }
    })

    // Procesar cada médico
    const resultados = await Promise.all(
      medicos.map(async (medico, index) => {
        console.log(`\n👨‍⚕️ Procesando médico ${index + 1}/${medicos.length}: ${medico.nombre}`)

        // Si no tiene ID, retornar sin cambios
        if (!medico.id) {
          console.log(`   ⚠️  Sin ID, saltando`)
          return medico
        }

        console.log(`   🆔 ID: ${medico.id}`)

        // Obtener eventos del médico
        const eventosDelMedico = await getEventosByDoctor(medico.id)
        console.log(`   📅 Eventos encontrados: ${eventosDelMedico.length}`)

        // Mostrar todos los eventos
        eventosDelMedico.forEach((evento, i) => {
          console.log(`     ${i + 1}. ${evento.type} en ${evento.fechaInicio}${evento.fechaFin ? ` hasta ${evento.fechaFin}` : ''}`)
        })

        // Filtrar eventos que aplican para este mes
        const eventosDelMes = eventosDelMedico.filter(evento => {
          const aplica = eventoAplicaEnMes(evento, mes, año)
          return aplica
        })

        console.log(`   ✅ Eventos que aplican para ${mes + 1}/${año}: ${eventosDelMes.length}`)

        // Crear copia de turnos para modificar
        const turnosActualizados = { ...medico.turnos }
        console.log(`   📋 Turnos originales:`, turnosActualizados)

        // Aplicar todos los eventos del mes
        eventosDelMes.forEach((evento, i) => {
          console.log(`\n   🔄 Aplicando evento ${i + 1}/${eventosDelMes.length}:`)
          aplicarEventoATurnos(evento, turnosActualizados, mes, año)
        })

        // Aplicar cumpleaños si corresponde
        const doctorData = doctoresMap.get(medico.id)
        if (doctorData) {
          console.log(`   🎂 Verificando cumpleaños...`)
          aplicarCumpleanos(doctorData, turnosActualizados, mes)
        }

        console.log(`   📋 Turnos finales:`, turnosActualizados)

        // Retornar médico con turnos actualizados
        return {
          ...medico,
          turnos: turnosActualizados
        }
      })
    )

    console.log(`\n✅ ===== EVENTOS ESPECIALES APLICADOS =====\n`)
    return resultados
  } catch (error) {
    console.error('❌ Error al aplicar eventos especiales:', error)
    return medicos
  }
}

// CORREGIDO: Función auxiliar para verificar si un médico tiene eventos en una fecha específica
export const verificarEventosMedicoEnFecha = async (
  medicoId: number,
  fecha: Date
): Promise<{ tieneEvento: boolean, eventos: EventoEspecial[] }> => {
  try {
    const eventos = await getEventosByDoctor(medicoId)
    const fechaConsulta = crearFechaSinZonaHoraria(fecha) // CORREGIDO: pasar Date directamente

    const eventosEnFecha = eventos.filter(evento => {
      if (evento.type === 'vacaciones' && evento.fechaFin) {
        const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
        const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)
        return fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin
      } else {
        const fechaEvento = crearFechaSinZonaHoraria(evento.fechaInicio)
        return fechaEvento.getTime() === fechaConsulta.getTime()
      }
    })

    return {
      tieneEvento: eventosEnFecha.length > 0,
      eventos: eventosEnFecha
    }
  } catch (error) {
    console.error('Error al verificar eventos del médico:', error)
    return { tieneEvento: false, eventos: [] }
  }
}

// Función existente (mantener tal como está)
export const calculateMonthlyHours = (mes: number, año: number): number => {
  const daysInMonth = new Date(año, mes + 1, 0).getDate()

  const colombianHolidays = {
    1: [1, 6],
    3: [24],
    4: [17, 18],
    5: [1],
    6: [2, 23, 30],
    7: [20],
    8: [7, 18],
    10: [13],
    11: [3, 17],
    12: [8, 25]
  }

  let sundays = 0
  let holidays = 0
  let holidaysOnSunday = 0

  const holidaysInMonth = colombianHolidays[mes + 1] || []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(año, mes, day)
    const isSunday = date.getDay() === 0
    const isHoliday = holidaysInMonth.includes(day)

    if (isSunday) sundays++
    if (isHoliday) holidays++
    if (isSunday && isHoliday) holidaysOnSunday++
  }

  const workingDays = daysInMonth - sundays - holidays + holidaysOnSunday
  const minimumHours = Math.round(workingDays * (44 / 6))

  return minimumHours
}
