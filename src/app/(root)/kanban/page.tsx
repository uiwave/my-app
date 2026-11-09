'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'todo' | 'in_progress' | 'done';
  diaId?: string;
}

const COLUMNS: { id: Task['estado']; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch('/api/tasks');
    const json = await res.json();
    if (json.success) setTasks(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Manejar el arrastre
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permite la soltura (drop)
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task['estado']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Actualización optimista en el estado local de UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, estado: targetStatus } : t))
    );

    // Persistir el cambio en Google Sheets mediante el endpoint PATCH
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, nuevoEstado: targetStatus }),
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: newTitle, descripcion: newDesc, estado: 'todo' }),
    });

    if (res.ok) {
      setNewTitle('');
      setNewDesc('');
      fetchTasks();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tablero Kanban (Google Sheets DB)</h1>

      {/* Formulario rápido para crear tareas */}
      <form onSubmit={handleAddTask} className="flex gap-3 mb-8 bg-neutral-900 p-4 border border-neutral-800 rounded-lg">
        <input
          type="text"
          placeholder="Título de la tarea..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
          className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
        />
        <input
          type="text"
          placeholder="Descripción (opcional)..."
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500 font-medium">
          + Añadir Tarea
        </button>
      </form>

      {/* Columnas Kanban */}
      {loading ? (
        <p className="text-neutral-400">Cargando tablero...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.estado === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 min-h-[450px] flex flex-col"
              >
                {/* Header de columna */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">{colTasks.length}</span>
                </div>

                {/* Zona de tarjetas */}
                <div className="flex-1 space-y-3">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="p-4 bg-neutral-800/80 border border-neutral-700/60 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-neutral-500 transition-colors"
                    >
                      <h3 className="font-semibold text-neutral-200">{task.titulo}</h3>
                      {task.descripcion && (
                        <p className="text-xs text-neutral-400 mt-1">{task.descripcion}</p>
                      )}
                      <div className="mt-3 text-[10px] text-neutral-500 font-mono">ID: {task.id}</div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-24 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-xs text-neutral-600">
                      Arrastra una tarjeta aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}