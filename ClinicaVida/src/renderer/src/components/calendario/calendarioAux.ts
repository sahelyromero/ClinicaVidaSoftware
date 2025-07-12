// calendarioAux.ts - VERSIÓN CORREGIDA

import { getEventosByDoctor, getDoctors } from '../../database/db'
import type { EventoEspecial, Doctor } from '../../database/db'
import type { Medico } from './calendario-func'

// Función para crear fecha sin zona horaria (solo fecha local)
const crearFechaSinZonaHoraria = (fechaString: string): Date => {
  // Si la fecha viene como string (ej: "2024-07-23"), crear fecha local
  if (typeof fechaString === 'string') {
    const [year, month, day] = fechaString.split('-').map(Number)
    return new Date(year, month - 1, day) // mes - 1 porque Date usa base 0
  }

  // Si ya es Date, verificar si tiene zona horaria
  const fecha = new Date(fechaString)
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
  }
}

// Función para verificar si un evento aplica en el mes
const eventoAplicaEnMes = (evento: EventoEspecial, mes: number, año: number): boolean => {
  const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
  const mesEvento = fechaInicio.getMonth()
  const añoEvento = fechaInicio.getFullYear()

  if (evento.type === 'vacaciones' && evento.fechaFin) {
    const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)
    const inicioMes = new Date(año, mes, 1)
    const finMes = new Date(año, mes + 1, 0)

    // Las vacaciones aplican si hay superposición con el mes actual
    return (mesEvento === mes && añoEvento === año) ||
           (fechaFin.getMonth() === mes && fechaFin.getFullYear() === año) ||
           (fechaInicio <= finMes && fechaFin >= inicioMes)
  } else {
    // Otros eventos aplican solo si están en el mes específico
    return mesEvento === mes && añoEvento === año
  }
}

// Función para aplicar un evento a los turnos
const aplicarEventoATurnos = (
  evento: EventoEspecial,
  turnos: Record<number, string>,
  mes: number,
  año: number
): void => {
  const simbolo = obtenerSimboloEvento(evento.type)
  if (!simbolo) return

  if (evento.type === 'vacaciones' && evento.fechaFin) {
    // Para vacaciones, aplicar a todos los días del rango
    const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
    const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)

    // Crear fecha actual para iterar
    const fechaActual = new Date(fechaInicio)

    while (fechaActual <= fechaFin) {
      if (fechaActual.getMonth() === mes && fechaActual.getFullYear() === año) {
        const dia = fechaActual.getDate()
        turnos[dia] = simbolo
      }
      fechaActual.setDate(fechaActual.getDate() + 1)
    }
  } else {
    // Para otros eventos de un solo día
    const fechaEvento = crearFechaSinZonaHoraria(evento.fechaInicio)
    if (fechaEvento.getMonth() === mes && fechaEvento.getFullYear() === año) {
      const dia = fechaEvento.getDate()
      turnos[dia] = simbolo

      // DEBUG: Agregar console.log para verificar
      console.log(`Aplicando evento ${simbolo} del doctor ${evento.doctorId} en fecha ${evento.fechaInicio} -> día ${dia} del mes ${mes + 1}`)
    }
  }
}

// Función principal para aplicar eventos especiales (refactorizada)
export const aplicarEventosEspeciales = async (
  medicos: Medico[],
  mes: number,
  año: number
): Promise<Medico[]> => {
  try {
    console.log(`Aplicando eventos especiales para ${mes + 1}/${año}`)

    // Obtener todos los doctores una sola vez
    const doctores = await getDoctors()

    // Crear mapa de doctores por ID para acceso rápido
    const doctoresMap = new Map<number, Doctor>()
    doctores.forEach(doctor => {
      if (doctor.id) {
        doctoresMap.set(doctor.id, doctor)
      }
    })

    // Procesar cada médico
    return await Promise.all(
      medicos.map(async (medico) => {
        // Si no tiene ID, retornar sin cambios
        if (!medico.id) return medico

        // Obtener eventos del médico
        const eventosDelMedico = await getEventosByDoctor(medico.id)

        // DEBUG: Mostrar eventos encontrados
        console.log(`Médico ${medico.nombre} (ID: ${medico.id}) tiene ${eventosDelMedico.length} eventos`)
        eventosDelMedico.forEach(evento => {
          console.log(`  - ${evento.type} en ${evento.fechaInicio}`)
        })

        // Filtrar eventos que aplican para este mes
        const eventosDelMes = eventosDelMedico.filter(evento =>
          eventoAplicaEnMes(evento, mes, año)
        )

        console.log(`Eventos que aplican para ${mes + 1}/${año}:`, eventosDelMes.length)

        // Crear copia de turnos para modificar
        const turnosActualizados = { ...medico.turnos }

        // Aplicar todos los eventos del mes
        eventosDelMes.forEach(evento => {
          aplicarEventoATurnos(evento, turnosActualizados, mes, año)
        })

        // Aplicar cumpleaños si corresponde
        const doctorData = doctoresMap.get(medico.id)
        if (doctorData) {
          aplicarCumpleanos(doctorData, turnosActualizados, mes)
        }

        // Retornar médico con turnos actualizados
        return {
          ...medico,
          turnos: turnosActualizados
        }
      })
    )
  } catch (error) {
    console.error('Error al aplicar eventos especiales:', error)
    return medicos
  }
}

// Función auxiliar para verificar si un médico tiene eventos en una fecha específica
export const verificarEventosMedicoEnFecha = async (
  medicoId: number,
  fecha: Date
): Promise<{ tieneEvento: boolean, eventos: EventoEspecial[] }> => {
  try {
    const eventos = await getEventosByDoctor(medicoId)
    const eventosEnFecha = eventos.filter(evento => {
      if (evento.type === 'vacaciones' && evento.fechaFin) {
        const fechaInicio = crearFechaSinZonaHoraria(evento.fechaInicio)
        const fechaFin = crearFechaSinZonaHoraria(evento.fechaFin)
        const fechaConsulta = crearFechaSinZonaHoraria(fecha.toISOString().split('T')[0])
        return fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin
      } else {
        const fechaEvento = crearFechaSinZonaHoraria(evento.fechaInicio)
        const fechaConsulta = crearFechaSinZonaHoraria(fecha.toISOString().split('T')[0])
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
