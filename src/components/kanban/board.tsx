'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { Task, COLUMNS, Status } from '@/types/kanban';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Diseñar arquitectura del backend', description: 'Definir endpoints en Spring Boot', status: 'TODO' },
  { id: '2', title: 'Configurar Tailwind v4', description: 'Usar directivas @theme en CSS', status: 'IN_PROGRESS' },
  { id: '3', title: 'Crear componentes base', description: 'Instalar primitives de shadcn', status: 'DONE' },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);

    if (isOverColumn) {
      const newStatus = overId as Status;
      if (activeTask.status !== newStatus) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
        );
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeTask.status !== overTask.status) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status } : t))
        );
      }
    }
  };

  // Evita renderizar dnd-kit durante SSR para corregir el hydration mismatch de aria-describedby
  if (!isMounted) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[600px] items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver}>
      <div className="flex gap-4 overflow-x-auto items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}