'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Task } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  dot: string;
}

export function TaskCard({ task, dot }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card
        size="sm"
        className="group cursor-grab active:cursor-grabbing hover:border-primary/50 hover:ring-1 hover:ring-primary/30 transition-all shadow-xs select-none"
      >
        <CardHeader className="p-3.5 pb-1.5">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            <CardTitle className="text-sm font-medium leading-snug">{task.titulo}</CardTitle>
            <span
              className={cn("mt-1 ml-auto size-2 shrink-0 rounded-full", dot)}
              aria-hidden
            />
          </div>
        </CardHeader>
        {task.descripcion && (
          <CardContent className="p-3.5 pt-0 text-xs text-muted-foreground">
            {task.descripcion}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
