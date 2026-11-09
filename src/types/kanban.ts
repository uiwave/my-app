export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type ApiEstado = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
}

export interface ApiTask {
  id: string;
  titulo: string;
  descripcion: string;
  estado: ApiEstado;
  diaId?: string;
}

export const COLUMNS: { id: Status; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
];

export function toBoardStatus(estado: ApiEstado | string): Status {
  switch (estado) {
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'done':
      return 'DONE';
    default:
      return 'TODO';
  }
}

export function toApiEstado(status: Status): ApiEstado {
  switch (status) {
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'DONE':
      return 'done';
    default:
      return 'todo';
  }
}

export function mapApiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.titulo,
    description: apiTask.descripcion,
    status: toBoardStatus(apiTask.estado),
  };
}