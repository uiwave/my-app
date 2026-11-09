'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { TaskCard } from './task-card';
import { Task, Column, colorToDot } from '@/types/kanban';

interface KanbanColumnProps {
  column: Column;
  index: number;
  total: number;
  tasks: Task[];
  onRename: (columnId: string, nombre: string) => void;
  onMove: (columnId: string, direction: -1 | 1) => void;
  onDelete: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  index,
  total,
  tasks,
  onRename,
  onMove,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.nombre);

  const dot = colorToDot(column.color);

  const submitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.nombre) {
      onRename(column.id, trimmed);
    }
    setEditing(false);
    setName(column.nombre);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/40 p-3.5 rounded-xl w-80 min-h-[550px] border shrink-0 transition-colors",
        isOver ? "border-primary/50 bg-muted/60" : "border-border/60"
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("size-2 rounded-full shrink-0", dot)} />
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setName(column.nombre);
                }
              }}
              autoFocus
              className="h-6 w-full min-w-0 text-xs font-semibold"
            />
          ) : (
            <h3 className="font-semibold text-xs tracking-wide text-foreground uppercase truncate">
              {column.nombre}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs bg-background border text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { setEditing(true); setName(column.nombre); }}>
                <Pencil />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(column.id, -1)}>
                <ArrowLeft />
                Mover a la izquierda
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(column.id, 1)}>
                <ArrowRight />
                Mover a la derecha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(column.id)}>
                <Trash2 />
                Eliminar columna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} dot={dot} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 min-h-24 border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground">
            Arrastra una tarjeta aquí
          </div>
        )}
      </div>
    </div>
  );
}
