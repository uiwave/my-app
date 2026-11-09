'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Task } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
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
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all shadow-xs select-none">
        <CardHeader className="p-3.5 pb-1.5">
          <CardTitle className="text-sm font-medium leading-snug">{task.title}</CardTitle>
        </CardHeader>
        {task.description && (
          <CardContent className="p-3.5 pt-0 text-xs text-muted-foreground">
            {task.description}
          </CardContent>
        )}
      </Card>
    </div>
  );
}