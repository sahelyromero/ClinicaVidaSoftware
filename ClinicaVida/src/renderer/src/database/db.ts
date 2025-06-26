// database/db.ts
export interface Doctor {
    id?: number;
    name: string;
    idNumber: string;
    birthDate: string;
    hasSpecialty: boolean;
    specialty?: string;
    group?: 'urgencias' | 'hospitalización' | 'refuerzo';
    email?: string;
}

const DB_NAME = 'ClinicaVidaDB';
const DB_VERSION = 2;
const STORE_NAME = 'doctors';

let dbInstance: IDBDatabase | null = null;

export const openDB = async (): Promise<IDBDatabase> => {
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Si la tabla ya existe, eliminarla para recrearla con los nuevos campos
            if (db.objectStoreNames.contains(STORE_NAME)) {
                db.deleteObjectStore(STORE_NAME);
            }
            
            const store = db.createObjectStore(STORE_NAME, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            // Crear índices para búsquedas eficientes
            store.createIndex('idNumber', 'idNumber', { unique: true });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('group', 'group', { unique: false });
            store.createIndex('hasSpecialty', 'hasSpecialty', { unique: false });
        };
    });
};

export const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<void> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(doctor);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getDoctors = async (): Promise<Doctor[]> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const updateDoctor = async (doctor: Doctor): Promise<void> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(doctor);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteDoctor = async (id: number): Promise<void> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getDoctorByIdNumber = async (idNumber: string): Promise<Doctor | undefined> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('idNumber');
        const request = index.get(idNumber);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getDoctorsByGroup = async (group: 'urgencias' | 'hospitalización' | 'refuerzo'): Promise<Doctor[]> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('group');
        const request = index.getAll(group);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getSpecialists = async (): Promise<Doctor[]> => {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('hasSpecialty');
        const request = index.getAll(true);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};