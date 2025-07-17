export const deleteEventoEspecial = async (id: number): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readwrite')
    const store = transaction.objectStore(EVENTOS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
} // database/db.ts
export interface Doctor {
  id?: number
  name: string
  idNumber: string
  birthDate: string
  hasSpecialty: boolean
  specialty?: string
  group?: 'urgencias' | 'hospitalización'
  email?: string
  horasTrabajadas: number
}

export interface EventoEspecial {
  id?: number
  doctorId: number
  type: 'vacaciones' | 'incapacidad' | 'calamidad' | 'dia_familia' | 'permiso_personal'
  fechaInicio: Date
  fechaFin?: Date // Solo para vacaciones
  descripcion?: string
  fechaCreacion: Date
}

const DB_NAME = 'ClinicaVidaDB'
const DB_VERSION = 3
const DOCTORS_STORE = 'doctors'
const EVENTOS_STORE = 'eventos_especiales'

let dbInstance: IDBDatabase | null = null

export const openDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store de doctores
      if (!db.objectStoreNames.contains(DOCTORS_STORE)) {
        const doctorsStore = db.createObjectStore(DOCTORS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        })

        doctorsStore.createIndex('idNumber', 'idNumber', { unique: true })
        doctorsStore.createIndex('name', 'name', { unique: false })
        doctorsStore.createIndex('group', 'group', { unique: false })
        doctorsStore.createIndex('hasSpecialty', 'hasSpecialty', { unique: false })
      }

      // Store de eventos especiales
      if (!db.objectStoreNames.contains(EVENTOS_STORE)) {
        const eventosStore = db.createObjectStore(EVENTOS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        })

        eventosStore.createIndex('doctorId', 'doctorId', { unique: false })
        eventosStore.createIndex('type', 'type', { unique: false })
        eventosStore.createIndex('fechaInicio', 'fechaInicio', { unique: false })
      }
    }
  })
}

// ================== FUNCIONES PARA DOCTORES ==================

export const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<void> => {
  const db = await openDB()
  const doctorWithHoras = { ...doctor, horasTrabajadas: 0 }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE], 'readwrite')
    const store = transaction.objectStore(DOCTORS_STORE)
    const request = store.add(doctorWithHoras)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getDoctors = async (): Promise<Doctor[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE], 'readonly')
    const store = transaction.objectStore(DOCTORS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const updateDoctor = async (doctor: Doctor): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE], 'readwrite')
    const store = transaction.objectStore(DOCTORS_STORE)
    const request = store.put(doctor)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const deleteDoctor = async (id: number): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE, EVENTOS_STORE], 'readwrite')

    // Eliminar doctor
    const doctorsStore = transaction.objectStore(DOCTORS_STORE)
    const deleteDoctorRequest = doctorsStore.delete(id)

    // Eliminar todos los eventos del doctor
    const eventosStore = transaction.objectStore(EVENTOS_STORE)
    const eventosIndex = eventosStore.index('doctorId')
    const getEventosRequest = eventosIndex.getAll(id)

    getEventosRequest.onsuccess = () => {
      const eventos = getEventosRequest.result
      eventos.forEach((evento) => {
        eventosStore.delete(evento.id!)
      })
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const getDoctorByIdNumber = async (idNumber: string): Promise<Doctor | undefined> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE], 'readonly')
    const store = transaction.objectStore(DOCTORS_STORE)
    const index = store.index('idNumber')
    const request = index.get(idNumber)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getDoctorsByGroup = async (group: 'urgencias' | 'hospitalización' | 'refuerzo'): Promise<Doctor[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCTORS_STORE], 'readonly')
    const store = transaction.objectStore(DOCTORS_STORE)
    const index = store.index('group')
    const request = index.getAll(group)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ================== FUNCIONES PARA EVENTOS ESPECIALES ==================

export const addEventoEspecial = async (evento: Omit<EventoEspecial, 'id' | 'fechaCreacion'>): Promise<void> => {
  const db = await openDB()
  const eventoCompleto = {
    ...evento,
    fechaCreacion: new Date()
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readwrite')
    const store = transaction.objectStore(EVENTOS_STORE)
    const request = store.add(eventoCompleto)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getEventosEspeciales = async (): Promise<EventoEspecial[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readonly')
    const store = transaction.objectStore(EVENTOS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getEventosByDoctor = async (doctorId: number): Promise<EventoEspecial[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readonly')
    const store = transaction.objectStore(EVENTOS_STORE)
    const index = store.index('doctorId')
    const request = index.getAll(doctorId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getEventosByFecha = async (fecha: Date): Promise<EventoEspecial[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readonly')
    const store = transaction.objectStore(EVENTOS_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const eventos = request.result.filter(evento => {
        if (evento.type === 'vacaciones') {
          // Para vacaciones, verificar si la fecha está en el rango
          return evento.fechaInicio <= fecha && evento.fechaFin && evento.fechaFin >= fecha
        } else {
          // Para otros eventos, verificar si es el mismo día
          return evento.fechaInicio.toDateString() === fecha.toDateString()
        }
      })
      resolve(eventos)
    }
    request.onerror = () => reject(request.error)
  })
}

export const getEventosByTipo = async (tipo: EventoEspecial['type']): Promise<EventoEspecial[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readonly')
    const store = transaction.objectStore(EVENTOS_STORE)
    const index = store.index('type')
    const request = index.getAll(tipo)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const updateEventoEspecial = async (evento: EventoEspecial): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTOS_STORE], 'readwrite')
    const store = transaction.objectStore(EVENTOS_STORE)
    const request = store.put(evento)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ================== FUNCIONES UTILITARIAS ==================

export const isDoctorDisponible = async (doctorId: number, fecha: Date): Promise<boolean> => {
  const eventos = await getEventosByDoctor(doctorId)

  return !eventos.some(evento => {
    if (evento.type === 'vacaciones') {
      // Para vacaciones, verificar si la fecha está en el rango
      return evento.fechaInicio <= fecha && evento.fechaFin && evento.fechaFin >= fecha
    } else {
      // Para otros eventos, verificar si es el mismo día
      return evento.fechaInicio.toDateString() === fecha.toDateString()
    }
  })
}

export const getEventosActivosEnFecha = async (fecha: Date): Promise<EventoEspecial[]> => {
  return await getEventosByFecha(fecha)
}
