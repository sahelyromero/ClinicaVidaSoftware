// calendario-func.ts

// Tipos necesarios
export interface Turno {
  [dia: number]: string // Ejemplo: { 1: "C", 2: "N" }
}

export interface Medico {
  nombre: string
  especialidad: string
  turnos: Turno
  grupo: string
  horasTrabajadas?: number
}

// Función para verificar si un día es lunes a viernes
export const esLunesAViernes = (dia: number, mes: number, año: number): boolean => {
  const fecha = new Date(año, mes, dia)
  const diaSemana = fecha.getDay()
  return diaSemana >= 1 && diaSemana <= 5
}

// Función para obtener todos los días hábiles del mes
export const getDiasLunesAViernes = (mes: number, año: number): number[] => {
  const diasDelMes = new Date(año, mes + 1, 0).getDate()
  const diasLV: number[] = []

  for (let dia = 1; dia <= diasDelMes; dia++) {
    if (esLunesAViernes(dia, mes, año)) {
      diasLV.push(dia)
    }
  }

  return diasLV
}

// Función para obtener todos los días del mes
export const getTodosDiasMes = (mes: number, año: number): number[] => {
  const diasDelMes = new Date(año, mes + 1, 0).getDate()
  const dias: number[] = []

  for (let dia = 1; dia <= diasDelMes; dia++) {
    dias.push(dia)
  }
  return dias
}

// Función para verificar si un médico puede trabajar en un día específico
const puedeTrabajarEnDia = (medico: Medico, dia: number): boolean => {
  // Ya tiene turno asignado este día
  if (medico.turnos[dia]) {
    return false
  }

  // Si el día anterior tuvo turno nocturno, no puede trabajar
  const diaAnterior = dia - 1
  if (diaAnterior >= 1 && medico.turnos[diaAnterior] === 'N') {
    return false
  }

  return true
}

// Función para verificar disponibilidad para turno nocturno
const puedeTrabajarTurnoNocturno = (medico: Medico, dia: number, todosDias: number[]): boolean => {
  if (!puedeTrabajarEnDia(medico, dia)) {
    return false
  }

  // Para turno nocturno, verificar que el día siguiente esté libre
  const diaSiguiente = dia + 1
  const ultimoDiaMes = todosDias[todosDias.length - 1]

  if (diaSiguiente <= ultimoDiaMes) {
    // El día siguiente debe estar libre
    if (medico.turnos[diaSiguiente]) {
      return false
    }
  }

  return true
}

// Función para contar turnos de un médico
const contarTurnos = (medico: Medico): { diurnos: number; nocturnos: number; total: number } => {
  const turnos = Object.values(medico.turnos)
  const diurnos = turnos.filter(t => t === 'C').length
  const nocturnos = turnos.filter(t => t === 'N').length
  return { diurnos, nocturnos, total: diurnos + nocturnos }
}

// Función para contar días sin trabajar consecutivos
const contarDiasSinTrabajar = (medico: Medico, diaActual: number): number => {
  let diasSinTrabajar = 0
  for (let dia = diaActual - 1; dia >= 1; dia--) {
    if (!medico.turnos[dia] || medico.turnos[dia] === 'L') {
      diasSinTrabajar++
    } else {
      break
    }
  }
  return diasSinTrabajar
}

// Función para obtener el último día trabajado
const obtenerUltimoDiaTrabajado = (medico: Medico, diaActual: number): number => {
  for (let dia = diaActual - 1; dia >= 1; dia--) {
    if (medico.turnos[dia] && medico.turnos[dia] !== 'L') {
      return dia
    }
  }
  return 0 // No ha trabajado antes
}

// Función para calcular puntaje de prioridad (mayor puntaje = mayor prioridad)
const calcularPuntajePrioridad = (medico: Medico, dia: number, tipoTurno: 'C' | 'N'): number => {
  const stats = contarTurnos(medico)
  let puntaje = 0

  // 1. Días sin trabajar (mayor peso)
  const diasSinTrabajar = contarDiasSinTrabajar(medico, dia)
  puntaje += diasSinTrabajar * 100

  // 2. Menor cantidad total de turnos
  const maxTurnosPosibles = dia // Máximo teórico para este punto del mes
  const proporcionTurnos = stats.total / Math.max(maxTurnosPosibles, 1)
  puntaje += (1 - proporcionTurnos) * 50

  // 3. Balancear tipo de turno específico
  if (tipoTurno === 'C') {
    // Para turnos diurnos, preferir quien tenga menos turnos diurnos
    puntaje += (stats.nocturnos - stats.diurnos) * 20
  } else {
    // Para turnos nocturnos, preferir quien tenga menos turnos nocturnos
    puntaje += (stats.diurnos - stats.nocturnos) * 20
  }

  // 4. Tiempo desde último turno trabajado
  const ultimoDiaTrabajado = obtenerUltimoDiaTrabajado(medico, dia)
  const diasDesdeUltimoTurno = dia - ultimoDiaTrabajado
  puntaje += diasDesdeUltimoTurno * 10

  // 5. Menor cantidad de horas trabajadas
  const horasMaximas = 166
  const proporcionHoras = (medico.horasTrabajadas || 0) / horasMaximas
  puntaje += (1 - proporcionHoras) * 30

  // 6. Factor de aleatoriedad para evitar patrones predecibles
  puntaje += Math.random() * 5

  return puntaje
}

// Función para seleccionar médicos con mejor dispersión
const seleccionarMedicosBalanceados = (
  medicosDisponibles: Medico[],
  cantidad: number,
  tipoTurno: 'C' | 'N',
  dia: number
): Medico[] => {
  // Calcular puntaje de prioridad para cada médico
  const medicosConPuntaje = medicosDisponibles.map(medico => ({
    medico,
    puntaje: calcularPuntajePrioridad(medico, dia, tipoTurno)
  }))

  // Ordenar por puntaje descendente (mayor puntaje = mayor prioridad)
  medicosConPuntaje.sort((a, b) => b.puntaje - a.puntaje)

  // Seleccionar los médicos con mayor puntaje
  return medicosConPuntaje.slice(0, cantidad).map(item => item.medico)
}

// Función principal para asignar turnos de urgencias
export const asignarTurnosUrgencias = (
  medicos: Medico[],
  mes: number,
  año: number,
  horasMaximasMes: number = 191, // Cambiar por la función que lo calcula automáticamente.
  horasTurnoDia: number = 12,
  horasTurnoNoche: number = 12
): Medico[] => {
  const todosDias = getTodosDiasMes(mes, año)
  const medicosUrgencias = medicos.filter(medico => medico.grupo === 'urgencias')
  const medicosSinUrgencias = medicos.filter(medico => medico.grupo !== 'urgencias')

  // Verificar que hay suficientes médicos
  if (medicosUrgencias.length < 8) {
    console.error(`Se necesitan al menos 8 médicos de urgencias. Solo hay ${medicosUrgencias.length}`)
    return medicos
  }

  // Inicializar médicos con turnos limpios
  const medicosConTurnos = medicosUrgencias.map(medico => ({
    ...medico,
    turnos: { ...medico.turnos },
    horasTrabajadas: medico.horasTrabajadas || 0
  }))

  // Procesar día por día
  for (const dia of todosDias) {
    // 1. Asignar turnos diurnos
    const medicosDisponiblesDia = medicosConTurnos.filter(medico => {
      // Verificar disponibilidad básica
      if (!puedeTrabajarEnDia(medico, dia)) {
        return false
      }

      // Verificar límite de horas
      if ((medico.horasTrabajadas || 0) + horasTurnoDia > horasMaximasMes) {
        return false
      }

      return true
    })

    const medicosSeleccionadosDia = seleccionarMedicosBalanceados(medicosDisponiblesDia, 4, 'C', dia)

    // Asignar turnos diurnos
    medicosSeleccionadosDia.forEach(medico => {
      medico.turnos[dia] = 'C'
      medico.horasTrabajadas = (medico.horasTrabajadas || 0) + horasTurnoDia
    })

    // 2. Asignar turnos nocturnos (excluyendo los que ya trabajan de día)
    const medicosDisponiblesNoche = medicosConTurnos.filter(medico => {
      // No puede ser uno de los que ya trabaja de día
      if (medicosSeleccionadosDia.includes(medico)) {
        return false
      }

      // Verificar disponibilidad para turno nocturno
      if (!puedeTrabajarTurnoNocturno(medico, dia, todosDias)) {
        return false
      }

      // Verificar límite de horas
      if ((medico.horasTrabajadas || 0) + horasTurnoNoche > horasMaximasMes) {
        return false
      }

      return true
    })

    const medicosSeleccionadosNoche = seleccionarMedicosBalanceados(medicosDisponiblesNoche, 4, 'N', dia)

    // Asignar turnos nocturnos
    medicosSeleccionadosNoche.forEach(medico => {
      medico.turnos[dia] = 'N'
      medico.horasTrabajadas = (medico.horasTrabajadas || 0) + horasTurnoNoche
    })

    // Verificar cobertura
    if (medicosSeleccionadosDia.length < 4) {
      console.warn(`Día ${dia}: Solo se asignaron ${medicosSeleccionadosDia.length} médicos de día (se necesitan 4)`)
    }
    if (medicosSeleccionadosNoche.length < 4) {
      console.warn(`Día ${dia}: Solo se asignaron ${medicosSeleccionadosNoche.length} médicos de noche (se necesitan 4)`)
    }
  }

  // Combinar todos los médicos
  return [...medicosConTurnos, ...medicosSinUrgencias]
}

// Función para asignar turnos de hospitalización
export const asignarTurnosHospitalizacion = (
  medicos: Medico[],
  mes: number,
  año: number
): Medico[] => {
  const diasLV = getDiasLunesAViernes(mes, año)

  return medicos.map(medico => {
    if (medico.grupo !== 'hospitalización') {
      return medico
    }

    const turnoAsignado = medico.especialidad.toLowerCase() === 'refuerzo' ? 'C6' : 'C8'
    const turnosActualizados: Turno = { ...medico.turnos }

    diasLV.forEach(dia => {
      turnosActualizados[dia] = turnoAsignado
    })

    return { ...medico, turnos: turnosActualizados }
  })
}

// Función para obtener estadísticas de asignación
export const obtenerEstadisticasAsignacion = (medicos: Medico[]): any => {
  const medicosUrgencias = medicos.filter(m => m.grupo === 'urgencias')

  const estadisticas = medicosUrgencias.map(medico => {
    const stats = contarTurnos(medico)
    return {
      nombre: medico.nombre,
      horasTrabajadas: medico.horasTrabajadas || 0,
      totalTurnos: stats.total,
      turnosDiurnos: stats.diurnos,
      turnosNocturnos: stats.nocturnos,
      balanceTurnos: Math.abs(stats.diurnos - stats.nocturnos)
    }
  })

  return {
    medicos: estadisticas,
    promedioHoras: estadisticas.length > 0 ?
      Math.round(estadisticas.reduce((sum, m) => sum + m.horasTrabajadas, 0) / estadisticas.length) : 0,
    promedioDiurnos: estadisticas.length > 0 ?
      Math.round(estadisticas.reduce((sum, m) => sum + m.turnosDiurnos, 0) / estadisticas.length) : 0,
    promedioNocturnos: estadisticas.length > 0 ?
      Math.round(estadisticas.reduce((sum, m) => sum + m.turnosNocturnos, 0) / estadisticas.length) : 0
  }
}

// Función para validar la asignación de turnos
export const validarAsignacionTurnos = (medicos: Medico[], mes: number, año: number): any => {
  const medicosUrgencias = medicos.filter(m => m.grupo === 'urgencias')
  const todosDias = getTodosDiasMes(mes, año)
  const errores: string[] = []
  const advertencias: string[] = []

  // Validar cobertura diaria
  todosDias.forEach(dia => {
    const medicosEnDia = medicosUrgencias.filter(m => m.turnos[dia] === 'C').length
    const medicosEnNoche = medicosUrgencias.filter(m => m.turnos[dia] === 'N').length

    if (medicosEnDia < 4) {
      errores.push(`Día ${dia}: Solo ${medicosEnDia} médicos en turno diurno (se necesitan 4)`)
    }
    if (medicosEnNoche < 4) {
      errores.push(`Día ${dia}: Solo ${medicosEnNoche} médicos en turno nocturno (se necesitan 4)`)
    }
  })

  // Validar restricciones individuales
  medicosUrgencias.forEach(medico => {
    const stats = contarTurnos(medico)

    // Validar límite de horas
    if ((medico.horasTrabajadas || 0) > 166) {
      errores.push(`${medico.nombre}: Excede el límite de horas (${medico.horasTrabajadas}/166)`)
    }

    // Validar descanso después de turno nocturno
    todosDias.forEach(dia => {
      if (medico.turnos[dia] === 'N') {
        const diaSiguiente = dia + 1
        if (diaSiguiente <= todosDias[todosDias.length - 1]) {
          const turnoSiguiente = medico.turnos[diaSiguiente]
          if (turnoSiguiente === 'C' || turnoSiguiente === 'N') {
            errores.push(`${medico.nombre}: Trabaja el día ${diaSiguiente} después de turno nocturno el día ${dia}`)
          }
        }
      }
    })

    // Advertir sobre desbalance de turnos
    if (Math.abs(stats.diurnos - stats.nocturnos) > 3) {
      advertencias.push(`${medico.nombre}: Desbalance de turnos - ${stats.diurnos} diurnos vs ${stats.nocturnos} nocturnos`)
    }
  })

  return {
    esValido: errores.length === 0,
    errores,
    advertencias,
    estadisticas: obtenerEstadisticasAsignacion(medicos)
  }
}
