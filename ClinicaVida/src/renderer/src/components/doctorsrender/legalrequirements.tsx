// LegalRequirements.tsx
import React from 'react';

export interface LegalRequirement {
  id: string;
  title: string;
  description: string;
  type: 'law' | 'regulation';
}

interface LegalRequirementsProps {
  legalRequirements: LegalRequirement[];
}

const LegalRequirements: React.FC<LegalRequirementsProps> = ({ legalRequirements }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Requerimientos Legales</h2>
      <div className="space-y-4">
        {legalRequirements.map((requirement) => (
          <div key={requirement.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-center mb-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                requirement.type === 'law'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {requirement.type === 'law' ? 'LEY' : 'REGULACIÓN'}
              </span>
              <h3 className="text-lg font-bold text-blue-800 ml-3">{requirement.title}</h3>
            </div>
            <p className="text-blue-700">{requirement.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-2">📋 Resumen de Cumplimiento</h4>
        <p className="text-sm text-gray-600">
          Estos requerimientos deben ser considerados al momento de asignar turnos y calcular horas laborales.
        </p>
      </div>
    </div>
  );
};

export default LegalRequirements;
