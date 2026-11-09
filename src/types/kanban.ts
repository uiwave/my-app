export interface Column {
  id: string;
  nombre: string;
  orden: number;
  color: string;
}

export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  columnaId: string;
}

export const COLUMN_COLORS: { name: string; dot: string; swatch: string }[] = [
  { name: 'amber', dot: 'bg-amber-500', swatch: 'bg-amber-500' },
  { name: 'blue', dot: 'bg-blue-500', swatch: 'bg-blue-500' },
  { name: 'purple', dot: 'bg-purple-500', swatch: 'bg-purple-500' },
  { name: 'emerald', dot: 'bg-emerald-500', swatch: 'bg-emerald-500' },
  { name: 'red', dot: 'bg-red-500', swatch: 'bg-red-500' },
  { name: 'sky', dot: 'bg-sky-500', swatch: 'bg-sky-500' },
  { name: 'violet', dot: 'bg-violet-500', swatch: 'bg-violet-500' },
  { name: 'rose', dot: 'bg-rose-500', swatch: 'bg-rose-500' },
  { name: 'orange', dot: 'bg-orange-500', swatch: 'bg-orange-500' },
  { name: 'teal', dot: 'bg-teal-500', swatch: 'bg-teal-500' },
  { name: 'indigo', dot: 'bg-indigo-500', swatch: 'bg-indigo-500' },
  { name: 'pink', dot: 'bg-pink-500', swatch: 'bg-pink-500' },
];

export function colorToDot(color: string): string {
  const found = COLUMN_COLORS.find((c) => c.name === color);
  return found ? found.dot : 'bg-blue-500';
}
