import { calculateMonthlyHours } from './calendarioAux'

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
  // CAMBIO: Eliminado ultimoFinDeSemanaTrabajado
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
  horasMaximasMes: number = calculateMonthlyHours(mes, año),
  horasTurnoDia: number = 12,
  horasTurnoNoche: number = 12
): Medico[] => {
  const todosDias = getTodosDiasMes(mes, año)
  const medicosUrgencias = medicos.filter(medico => medico.grupo === 'urgencias')
  const medicosSinUrgencias = medicos.filter(medico => medico.grupo !== 'urgencias')

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

// Función para asignar turnos de hospitalización (días de semana)
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

// Función para obtener los fines de semana de un mes
export const getFinesDeSemana = (mes: number, año: number): number[][] => {
  const finesDeSemana: number[][] = []
  const diasDelMes = new Date(año, mes + 1, 0).getDate()

  let finDeSemanaActual: number[] = []

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fecha = new Date(año, mes, dia)
    const diaSemana = fecha.getDay() // 0 = Domingo, 6 = Sábado

    if (diaSemana === 0 || diaSemana === 6) { // Es sábado o domingo
      finDeSemanaActual.push(dia)
    } else {
      // Si no es fin de semana y tenemos días acumulados, es un fin de semana completo
      if (finDeSemanaActual.length > 0) {
        finesDeSemana.push(finDeSemanaActual)
        finDeSemanaActual = []
      }
    }
  }

  // Añadir el último fin de semana si el mes termina en sábado/domingo
  if (finDeSemanaActual.length > 0) {
    finesDeSemana.push(finDeSemanaActual)
  }

  return finesDeSemana
}

// Función para asignar turnos de fin de semana a hospitalización
export const asignarTurnosFinDeSemanaHospitalizacion = (
  medicos: Medico[],
  mes: number,
  año: number,
  horasMaximasMes: number = calculateMonthlyHours(mes, año),
  horasTurnoFinDeSemana: number = 10
): Medico[] => {
  // Realiza una copia profunda para no modificar el array original directamente
  const medicosCopia: Medico[] = JSON.parse(JSON.stringify(medicos));

  const finesDeSemana = getFinesDeSemana(mes, año);
  const diasDelMes = new Date(año, mes + 1, 0).getDate();
  const todosDias = Array.from({length: diasDelMes}, (_, i) => i + 1); // Array de 1 a 30/31

  // Función auxiliar para ajustar horas excedentes
  const ajustarHorasExcedentes = (medico: Medico) => {
    let horasExcedente = (medico.horasTrabajadas || 0) - horasMaximasMes;
    if (horasExcedente <= 0) return;

    console.warn(`Ajustando horas excedidas para ${medico.nombre}. Excede por ${horasExcedente} horas.`);

    // 1. Buscar y eliminar domingos asignados (prioridad alta)
    const domingosAsignados = todosDias.filter(dia => {
      const fecha = new Date(año, mes, dia);
      return fecha.getDay() === 0 && medico.turnos[dia] === 'C10';
    }).sort((a, b) => b - a); // Ordenar de mayor a menor día para eliminar los últimos domingos primero

    for (const dia of domingosAsignados) {
      if (horasExcedente > 0) {
        delete medico.turnos[dia];
        medico.horasTrabajadas = (medico.horasTrabajadas || 0) - horasTurnoFinDeSemana;
        horasExcedente -= horasTurnoFinDeSemana;
        console.log(`  - Eliminado turno C10 del día ${dia} (Domingo) para ${medico.nombre}. Horas restantes: ${medico.horasTrabajadas}`);
      } else {
        break; // Ya no hay excedente
      }
    }

    // 2. Si aún hay excedente, buscar y eliminar sábados asignados
    const sabadosAsignados = todosDias.filter(dia => {
      const fecha = new Date(año, mes, dia);
      return fecha.getDay() === 6 && medico.turnos[dia] === 'C10';
    }).sort((a, b) => b - a); // Ordenar de mayor a menor día

    for (const dia of sabadosAsignados) {
      if (horasExcedente > 0) {
        delete medico.turnos[dia];
        medico.horasTrabajadas = (medico.horasTrabajadas || 0) - horasTurnoFinDeSemana;
        horasExcedente -= horasTurnoFinDeSemana;
        console.log(`  - Eliminado turno C10 del día ${dia} (Sábado) para ${medico.nombre}. Horas restantes: ${medico.horasTrabajadas}`);
      } else {
        break;
      }
    }

    // 3. Si aún hay excedente (lo cual no debería pasar con la lógica actual, pero como fallback)
    //    Se podrían eliminar otros turnos si fuera necesario, pero la instrucción es preferir domingos.
    if (horasExcedente > 0) {
      console.warn(`  - Advertencia: ${medico.nombre} aún excede horas (${horasExcedente}) después de eliminar fines de semana. Considerar ajuste manual.`);
    }
  };

  // Especialidades disponibles (las cirugías se agruparán bajo "cirugía")
  const especialidadesCirugia = [
    'cirugía oncológica',
    'cirugía de tórax', 
    'cirugía hepatobiliar'
  ];

  const otrasEspecialidades = [
    'oncología',
    'hemato-oncología',
    'medicina interna',
    'dolor y cuidados paliativos',
    'refuerzo'
  ];

  finesDeSemana.forEach(fds => {
    const especialidadesAsignadasEsteFDS = new Set<string>();
    const cirugiasAsignadasEsteFDS = []; // Para rastrear médicos de cirugía asignados en este FDS
    
    // Ordenar médicos disponibles por horas trabajadas para balancear la carga
    const medicosDisponiblesParaFDS = medicosCopia
      .filter(m => m.grupo === 'hospitalización')
      .filter(m => fds.every(dia => !m.turnos[dia])) // Asegurarse de que no tengan turnos ya asignados en este FDS
      .sort((a, b) => (a.horasTrabajadas || 0) - (b.horasTrabajadas || 0)); // Priorizar los con menos horas

    // 1. Asignar las "otras especialidades" (1 médico por especialidad)
    otrasEspecialidades.forEach(especialidad => {
      const medicoParaAsignar = medicosDisponiblesParaFDS.find(medico => {
        return medico.especialidad.toLowerCase() === especialidad.toLowerCase() &&
               !especialidadesAsignadasEsteFDS.has(especialidad) &&
               ((medico.horasTrabajadas || 0) + (horasTurnoFinDeSemana * fds.length) <= horasMaximasMes);
      });

      if (medicoParaAsignar) {
        fds.forEach(dia => {
          medicoParaAsignar.turnos[dia] = 'C10';
        });
        medicoParaAsignar.horasTrabajadas = (medicoParaAsignar.horasTrabajadas || 0) + (horasTurnoFinDeSemana * fds.length);
        especialidadesAsignadasEsteFDS.add(especialidad);
        console.log(`[1/1] Asignado C10 a ${medicoParaAsignar.nombre} (${medicoParaAsignar.especialidad}) para FDS ${fds.join(',')}`);
      }
    });

    // 2. Asignar cirugías (máximo 2 médicos para todo el grupo de cirugía)
    medicosDisponiblesParaFDS.forEach(medico => {
      const espec = medico.especialidad.toLowerCase();
      
      if (especialidadesCirugia.includes(espec) && 
          cirugiasAsignadasEsteFDS.length < 2 &&
          !especialidadesAsignadasEsteFDS.has('cirugía')) { // Usamos 'cirugía' como clave para el Set
          
        const horasTotalesPrevistas = (medico.horasTrabajadas || 0) + horasTurnoFinDeSemana * fds.length;
        
        if (horasTotalesPrevistas <= horasMaximasMes) {
          fds.forEach(dia => {
            medico.turnos[dia] = 'C10';
          });
          medico.horasTrabajadas = horasTotalesPrevistas;
          cirugiasAsignadasEsteFDS.push(medico);
          especialidadesAsignadasEsteFDS.add('cirugía'); // Marcamos que ya asignamos del grupo cirugía
          console.log(`[${cirugiasAsignadasEsteFDS.length}/2] Asignado C10 a cirujano ${medico.nombre} (${medico.especialidad}) para FDS ${fds.join(',')}`);
        }
      }
    });

    if (especialidadesAsignadasEsteFDS.size === 0) {
      console.warn(`⚠️ No se asignaron médicos para el fin de semana ${fds.join(',')}`);
    }
  });

  // Paso final: Ajustar horas de todos los médicos de hospitalización si exceden el límite
  medicosCopia.forEach(medico => {
    if (medico.grupo === 'hospitalización' && (medico.horasTrabajadas || 0) > horasMaximasMes) {
      ajustarHorasExcedentes(medico);
    }
  });

  return medicosCopia;
};


// Función para obtener estadísticas de asignación
export const obtenerEstadisticasAsignacion = (medicos: Medico[]): any => {
  const medicosUrgencias = medicos.filter(m => m.grupo === 'urgencias')
  const medicosHospitalizacion = medicos.filter(m => m.grupo === 'hospitalización')

  const estadisticasUrgencias = medicosUrgencias.map(medico => {
    const stats = contarTurnos(medico)
    return {
      nombre: medico.nombre,
      grupo: medico.grupo,
      horasTrabajadas: medico.horasTrabajadas || 0,
      totalTurnos: stats.total,
      turnosDiurnos: stats.diurnos,
      turnosNocturnos: stats.nocturnos,
      balanceTurnos: Math.abs(stats.diurnos - stats.nocturnos)
    }
  })

  const estadisticasHospitalizacion = medicosHospitalizacion.map(medico => {
    const turnosC6 = Object.values(medico.turnos).filter(t => t === 'C6').length;
    const turnosC8 = Object.values(medico.turnos).filter(t => t === 'C8').length;
    const turnosC10 = Object.values(medico.turnos).filter(t => t === 'C10').length;
    return {
      nombre: medico.nombre,
      grupo: medico.grupo,
      especialidad: medico.especialidad,
      horasTrabajadas: medico.horasTrabajadas || 0,
      totalTurnos: turnosC6 + turnosC8 + turnosC10,
      turnosC6,
      turnosC8,
      turnosC10
    }
  })

  const todasEstadisticas = [...estadisticasUrgencias, ...estadisticasHospitalizacion];

  return {
    medicos: todasEstadisticas,
    promedioHorasUrgencias: estadisticasUrgencias.length > 0 ?
      Math.round(estadisticasUrgencias.reduce((sum, m) => sum + m.horasTrabajadas, 0) / estadisticasUrgencias.length) : 0,
    promedioDiurnosUrgencias: estadisticasUrgencias.length > 0 ?
      Math.round(estadisticasUrgencias.reduce((sum, m) => sum + m.turnosDiurnos, 0) / estadisticasUrgencias.length) : 0,
    promedioNocturnosUrgencias: estadisticasUrgencias.length > 0 ?
      Math.round(estadisticasUrgencias.reduce((sum, m) => sum + m.turnosNocturnos, 0) / estadisticasUrgencias.length) : 0,
    promedioHorasHospitalizacion: estadisticasHospitalizacion.length > 0 ?
      Math.round(estadisticasHospitalizacion.reduce((sum, m) => sum + m.horasTrabajadas, 0) / estadisticasHospitalizacion.length) : 0,
  }
}

// Función para validar la asignación de turnos
export const validarAsignacionTurnos = (medicos: Medico[], mes: number, año: number): any => {
  const medicosUrgencias = medicos.filter(m => m.grupo === 'urgencias')
  const medicosHospitalizacion = medicos.filter(m => m.grupo === 'hospitalización')
  const todosDias = getTodosDiasMes(mes, año)
  const errores: string[] = []
  const advertencias: string[] = []

  // Validar cobertura diaria de Urgencias
  todosDias.forEach(dia => {
    const medicosEnDia = medicosUrgencias.filter(m => m.turnos[dia] === 'C').length
    const medicosEnNoche = medicosUrgencias.filter(m => m.turnos[dia] === 'N').length

    if (medicosEnDia < 4) {
      errores.push(`Día ${dia}: Solo ${medicosEnDia} médicos de urgencias en turno diurno (se necesitan 4)`)
    }
    if (medicosEnNoche < 4) {
      errores.push(`Día ${dia}: Solo ${medicosEnNoche} médicos de urgencias en turno nocturno (se necesitan 4)`)
    }
  })

  // Validar restricciones individuales de Urgencias
  medicosUrgencias.forEach(medico => {
    const stats = contarTurnos(medico)

    // Validar límite de horas
    if ((medico.horasTrabajadas || 0) > 166) {
      errores.push(`${medico.nombre} (Urgencias): Excede el límite de horas (${medico.horasTrabajadas}/166)`)
    }

    // Validar descanso después de turno nocturno
    todosDias.forEach(dia => {
      if (medico.turnos[dia] === 'N') {
        const diaSiguiente = dia + 1
        if (diaSiguiente <= todosDias[todosDias.length - 1]) {
          const turnoSiguiente = medico.turnos[diaSiguiente]
          if (turnoSiguiente === 'C' || turnoSiguiente === 'N') {
            errores.push(`${medico.nombre} (Urgencias): Trabaja el día ${diaSiguiente} después de turno nocturno el día ${dia}`)
          }
        }
      }
    })

    // Advertir sobre desbalance de turnos
    if (Math.abs(stats.diurnos - stats.nocturnos) > 3) {
      advertencias.push(`${medico.nombre} (Urgencias): Desbalance de turnos - ${stats.diurnos} diurnos vs ${stats.nocturnos} nocturnos`)
    }
  })

  // Validar restricciones individuales de Hospitalización
  medicosHospitalizacion.forEach(medico => {
    // Validar límite de horas
    if ((medico.horasTrabajadas || 0) > 166) {
      errores.push(`${medico.nombre} (Hospitalización): Excede el límite de horas (${medico.horasTrabajadas}/166)`)
    }

    // Validar que no trabaje en días consecutivos si tiene C10 (asumiendo que C10 requiere descanso)
    todosDias.forEach(dia => {
      if (medico.turnos[dia] === 'C10') {
        const diaSiguiente = dia + 1;
        if (diaSiguiente <= todosDias[todosDias.length - 1]) {
          const turnoSiguiente = medico.turnos[diaSiguiente];
          if (turnoSiguiente && turnoSiguiente !== 'L') {
            advertencias.push(`${medico.nombre} (Hospitalización): Trabaja el día ${diaSiguiente} después de un turno C10 el día ${dia}. Considerar descanso.`);
          }
        }
      }
    });
  });


  return {
    esValido: errores.length === 0,
    errores,
    advertencias,
    estadisticas: obtenerEstadisticasAsignacion(medicos)
  }
}
