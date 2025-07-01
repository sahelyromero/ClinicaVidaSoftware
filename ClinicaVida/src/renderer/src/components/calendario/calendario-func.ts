// calendario-func.ts

// Tipos necesarios
export interface Turno {
  [dia: number]: string; // Ejemplo: { 1: "C8", 2: "C10" }
}

export interface Medico {
  nombre: string;
  especialidad: string;
  turnos: Turno;
  grupo: string;
}

// Función para verificar si un día es lunes a viernes
export const esLunesAViernes = (dia: number, mes: number, año: number): boolean => {
  const fecha = new Date(año, mes, dia);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  return diaSemana >= 1 && diaSemana <= 5; // Lunes (1) a Viernes (5)
};

// Función para obtener todos los días hábiles del mes
export const getDiasLunesAViernes = (mes: number, año: number): number[] => {
  const diasDelMes = new Date(año, mes + 1, 0).getDate(); // Total días del mes
  const diasLV: number[] = [];

  for (let dia = 1; dia <= diasDelMes; dia++) {
    if (esLunesAViernes(dia, mes, año)) {
      diasLV.push(dia);
    }
  }

  return diasLV;
};

// Función principal: asigna turnos "C8" a médicos de hospitalización en días hábiles
export const asignarTurnosHospitalizacion = (
  medicos: Medico[],
  mes: number,
  año: number
): Medico[] => {
  const diasLV = getDiasLunesAViernes(mes, año);

  return medicos.map((medico) => {
    const esHospitalizacion = medico.grupo === 'hospitalización';

    if (!esHospitalizacion) {
      return medico;
    }

    const turnoAsignado = medico.especialidad.toLowerCase() === 'refuerzo' ? 'C6' : 'C8';

    const turnosActualizados: Turno = { ...medico.turnos };

    diasLV.forEach((dia) => {
      turnosActualizados[dia] = turnoAsignado;
    });

    return {
      ...medico,
      turnos: turnosActualizados
    };
  });
};