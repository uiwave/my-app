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
import { Task, Column } from '@/types/kanban';

interface KanbanBoardProps {
  tasks: Task[];
  columns: Column[];
  onColumnChange: (taskId: string, newColumnId: string) => void;
  onRenameColumn: (columnId: string, nombre: string) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanBoard({
  tasks,
  columns,
  onColumnChange,
  onRenameColumn,
  onMoveColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const dragStartStatus = useRef<Record<string, string>>({});

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
      dragStartStatus.current[String(active.id)] = activeTask.columnaId;
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

    const isOverColumn = columns.some((col) => col.id === overId);

    if (isOverColumn) {
      const newColumnId = String(overId);
      if (activeTask.columnaId !== newColumnId) {
        onColumnChange(String(activeId), newColumnId);
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeTask.columnaId !== overTask.columnaId) {
        onColumnChange(String(activeId), overTask.columnaId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const originalColumn = dragStartStatus.current[String(active.id)];
    if (originalColumn) {
      const finalTask = tasks.find((t) => t.id === active.id);
      if (finalTask && finalTask.columnaId !== originalColumn) {
        onColumnChange(String(active.id), finalTask.columnaId);
      }
      delete dragStartStatus.current[String(active.id)];
    }
  };

  // Evita renderizar dnd-kit durante SSR para corregir el hydration mismatch de aria-describedby
  if (!isMounted) {
    return (
      <div className="flex gap-4 overflow-x-auto min-h-[600px] items-start">
        {columns.map((col, i) => (
          <KanbanColumn
            key={col.id}
            column={col}
            index={i}
            total={columns.length}
            tasks={tasks.filter((t) => t.columnaId === col.id)}
            onRename={onRenameColumn}
            onMove={onMoveColumn}
            onDelete={onDeleteColumn}
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
      <div className="flex gap-4 items-start">
        {columns.map((col, i) => (
          <KanbanColumn
            key={col.id}
            column={col}
            index={i}
            total={columns.length}
            tasks={tasks.filter((t) => t.columnaId === col.id)}
            onRename={onRenameColumn}
            onMove={onMoveColumn}
            onDelete={onDeleteColumn}
          />
        ))}
      </div>
    </DndContext>
  );
}
