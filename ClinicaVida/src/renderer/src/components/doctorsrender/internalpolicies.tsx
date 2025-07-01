// InternalPolicies.tsx
import React from 'react';

export interface InternalPolicy {
  id: string;
  title: string;
  description: string;
  category: 'schedules' | 'groups' | 'specialties';
}

interface InternalPoliciesProps {
  internalPolicies: InternalPolicy[];
}

const InternalPolicies: React.FC<InternalPoliciesProps> = ({ internalPolicies }) => {
  return (
    <div className="max-h-[70vh] overflow-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Políticas Internas</h2>
      <div className="space-y-4">
        {internalPolicies.map((policy) => (
          <div key={policy.id} className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex items-center mb-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                policy.category === 'schedules'
                  ? 'bg-blue-100 text-blue-800'
                  : policy.category === 'groups'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {policy.category === 'schedules' && 'HORARIOS'}
                {policy.category === 'groups' && 'GRUPOS'}
                {policy.category === 'specialties' && 'ESPECIALIDADES'}
              </span>
              <h3 className="text-lg font-bold text-green-800 ml-3">{policy.title}</h3>
            </div>
            <p className="text-green-700">{policy.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-2">⚙️ Configuración Actual</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <span className="block text-xl font-bold text-purple-600">2</span>
            <span className="text-sm text-gray-600">Grupos Principales</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-orange-600">8</span>
            <span className="text-sm text-gray-600">Especialidades</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-blue-600">3</span>
            <span className="text-sm text-gray-600">Tipos de Turno</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalPolicies;
