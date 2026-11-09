'use client';

import { useEffect, useState } from 'react';

interface Dia {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Schedule {
  id: string;
  materia: string;
  diaId: string;
  dia: Dia | null;
  horaInicio: string;
  horaFin: string;
}

export default function Page() {
  const [dias, setDias] = useState<Dia[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    materia: '',
    diaId: '',
    horaInicio: '08:00',
    horaFin: '10:00',
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/schedules');
    const json = await res.json();
    
    if (json.success) {
      const diasActivos = json.data.dias.filter((d: Dia) => d.activo);
      setDias(diasActivos);
      setSchedules(json.data.horarios);

      if (diasActivos.length > 0 && !form.diaId) {
        setForm((prev) => ({ ...prev, diaId: diasActivos[0].id }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setForm({ materia: '', diaId: dias[0]?.id || '', horaInicio: '08:00', horaFin: '10:00' });
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Horarios por Día Relacionado</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Agregar Horario</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Asignatura / Trabajo"
            value={form.materia}
            onChange={(e) => setForm({ ...form, materia: e.target.value })}
            required
            className="p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
          />

          {/* Selector dinamico por clave de día */}
          <select
            value={form.diaId}
            onChange={(e) => setForm({ ...form, diaId: e.target.value })}
            className="p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
          >
            {dias.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.id})
              </option>
            ))}
          </select>

          <input
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            required
            className="p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
          />

          <input
            type="time"
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            required
            className="p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500">
          Guardar Horario
        </button>
      </form>

      {/* Tabla con la relacion visual */}
      {loading ? (
        <p className="text-neutral-400">Cargando datos...</p>
      ) : (
        <table className="w-full border-collapse border border-neutral-800 text-left">
          <thead>
            <tr className="bg-neutral-800 text-neutral-300">
              <th className="p-3 border border-neutral-700">Materia</th>
              <th className="p-3 border border-neutral-700">Día (Nombre)</th>
              <th className="p-3 border border-neutral-700">Clave Día (FK)</th>
              <th className="p-3 border border-neutral-700">Horario</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((sch) => (
              <tr key={sch.id} className="border-b border-neutral-800">
                <td className="p-3 font-medium">{sch.materia}</td>
                <td className="p-3 text-blue-400 font-semibold">{sch.dia?.nombre || 'Día no encontrado'}</td>
                <td className="p-3 font-mono text-xs text-neutral-400">{sch.diaId}</td>
                <td className="p-3">{sch.horaInicio} - {sch.horaFin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}