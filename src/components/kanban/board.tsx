'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { Task, COLUMNS, Status } from '@/types/kanban';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Status) => void;
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const dragStartStatus = useRef<Record<string, Status>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (activeTask) {
      dragStartStatus.current[String(active.id)] = activeTask.status;
    }
  };

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
        onStatusChange(String(activeId), newStatus);
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeTask.status !== overTask.status) {
        onStatusChange(String(activeId), overTask.status);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const originalStatus = dragStartStatus.current[String(active.id)];
    if (originalStatus) {
      const finalTask = tasks.find((t) => t.id === active.id);
      if (finalTask && finalTask.status !== originalStatus) {
        onStatusChange(String(active.id), finalTask.status);
      }
      delete dragStartStatus.current[String(active.id)];
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
