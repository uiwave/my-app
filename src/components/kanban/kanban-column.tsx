'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { Task, Status } from '@/types/kanban';

interface KanbanColumnProps {
  column: { id: Status; label: string };
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col bg-muted/40 p-3.5 rounded-xl w-80 min-h-[550px] border border-border/60 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-xs tracking-wide text-foreground uppercase">{column.label}</h3>
        <span className="text-xs bg-background border text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}