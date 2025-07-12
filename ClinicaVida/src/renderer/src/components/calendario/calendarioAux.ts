import { getEventosByDoctor, getDoctors } from '../../database/db'
import type { EventoEspecial, Doctor } from '../../database/db'
import type { Medico } from './calendario-func'

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
  const fechaNacimiento = new Date(doctor.birthDate)
  if (fechaNacimiento.getMonth() === mes) {
    const dia = fechaNacimiento.getDate()
    turnos[dia] = 'C4'
  }
}

// Función para verificar si un evento aplica en el mes
const eventoAplicaEnMes = (evento: EventoEspecial, mes: number, año: number): boolean => {
  const fechaInicio = new Date(evento.fechaInicio)
  const mesEvento = fechaInicio.getMonth()
  const añoEvento = fechaInicio.getFullYear()

  if (evento.type === 'vacaciones' && evento.fechaFin) {
    const fechaFin = new Date(evento.fechaFin)
    // Las vacaciones aplican si hay superposición con el mes actual
    return (mesEvento === mes && añoEvento === año) ||
           (fechaFin.getMonth() === mes && fechaFin.getFullYear() === año) ||
           (fechaInicio <= new Date(año, mes, 1) && fechaFin >= new Date(año, mes + 1, 0))
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
    const fechaInicio = new Date(evento.fechaInicio)
    const fechaFin = new Date(evento.fechaFin)

    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() === mes && d.getFullYear() === año) {
        const dia = d.getDate()
        turnos[dia] = simbolo
      }
    }
  } else {
    // Para otros eventos de un solo día
    const fechaEvento = new Date(evento.fechaInicio)
    if (fechaEvento.getMonth() === mes && fechaEvento.getFullYear() === año) {
      const dia = fechaEvento.getDate()
      turnos[dia] = simbolo
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

        // Filtrar eventos que aplican para este mes
        const eventosDelMes = eventosDelMedico.filter(evento =>
          eventoAplicaEnMes(evento, mes, año)
        )

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
        const fechaInicio = new Date(evento.fechaInicio)
        const fechaFin = new Date(evento.fechaFin)
        return fecha >= fechaInicio && fecha <= fechaFin
      } else {
        const fechaEvento = new Date(evento.fechaInicio)
        return fechaEvento.toDateString() === fecha.toDateString()
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
  // Corregir: para obtener los días del mes actual, usar mes + 1
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

  // Corregir: usar mes + 1 para los festivos también
  const holidaysInMonth = colombianHolidays[mes + 1] || []

  for (let day = 1; day <= daysInMonth; day++) {
    // Esta línea está correcta - usa mes tal como viene (base 0)
    const date = new Date(año, mes, day)
    const isSunday = date.getDay() === 0
    const isHoliday = holidaysInMonth.includes(day)

    if (isSunday) sundays++
    if (isHoliday) holidays++
    if (isSunday && isHoliday) holidaysOnSunday++
  }

  const workingDays = daysInMonth - sundays - holidays + holidaysOnSunday
  const minimumHours = Math.round(workingDays * (44 / 6))

  console.log(`Mes ${mes + 1}/${año}:`, {
    daysInMonth,
    sundays,
    holidays,
    holidaysOnSunday,
    workingDays,
    minimumHours
  })

  return minimumHours
}
