"use client";

import { useEffect, useRef, useState } from "react";

import { KanbanBoard } from "@/components/kanban/board";
import { ApiTask, Status, Task, mapApiTask, toApiEstado } from "@/types/kanban";

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const lastPersisted = useRef<Record<string, Status>>({});

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const json = await res.json();
    if (json.success) {
      const mapped = (json.data as ApiTask[]).map(mapApiTask);
      setTasks(mapped);
      const statusMap: Record<string, Status> = {};
      for (const t of mapped) statusMap[t.id] = t.status;
      lastPersisted.current = statusMap;
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    if (lastPersisted.current[taskId] === newStatus) return;
    const prevStatus = lastPersisted.current[taskId];
    lastPersisted.current[taskId] = newStatus;

    // Actualización optimista en el estado local de UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      // Persistir el cambio en Google Sheets mediante el endpoint PATCH
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          nuevoEstado: toApiEstado(newStatus),
        }),
      });
    } catch {
      // Rollback si la API falla
      if (prevStatus) {
        lastPersisted.current[taskId] = prevStatus;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)),
        );
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: newTitle,
          descripcion: newDesc,
          estado: "todo",
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        fetchTasks();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleAddTask}
        className="flex gap-3 mb-8 bg-neutral-900 p-4 border border-neutral-800 rounded-lg"
      >
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
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500 font-medium disabled:opacity-50"
        >
          + Añadir Tarea
        </button>
      </form>

      {loading ? (
        <p className="text-neutral-400">Cargando tablero...</p>
      ) : (
        <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
      )}
    </>
  );
}
