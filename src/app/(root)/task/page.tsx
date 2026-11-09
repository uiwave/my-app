"use client";

import { useEffect, useRef, useState } from "react";
import { ListTodo, Plus, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { KanbanBoard } from "@/components/kanban/board";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Column, COLUMN_COLORS, Task } from "@/types/kanban";

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedCol, setSelectedCol] = useState("");
  const [creating, setCreating] = useState(false);

  const [creatingCol, setCreatingCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState("blue");
  const [busyCol, setBusyCol] = useState(false);

  const lastPersisted = useRef<Record<string, string>>({});

  const loadColumns = async () => {
    const res = await fetch("/api/scrum/task-status");
    const json = await res.json();
    if (json.success) {
      setColumns(json.data as Column[]);
      setSelectedCol((prev) => {
        const list = json.data as Column[];
        if (!list.some((c) => c.id === prev)) return list[0]?.id || "";
        return prev;
      });
    }
  };

  const loadTasks = async () => {
    const res = await fetch("/api/tasks");
    const json = await res.json();
    if (json.success) {
      const list = json.data as Task[];
      setTasks(list);
      const statusMap: Record<string, string> = {};
      for (const t of list) statusMap[t.id] = t.columnaId;
      lastPersisted.current = statusMap;
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadColumns(), loadTasks()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Mover tarjeta entre columnas (drag & drop)
  const handleColumnChange = async (taskId: string, newColumnId: string) => {
    if (lastPersisted.current[taskId] === newColumnId) return;
    const prevColumn = lastPersisted.current[taskId];
    lastPersisted.current[taskId] = newColumnId;

    // Actualización optimista en el estado local de UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, columnaId: newColumnId } : t)),
    );

    try {
      // Persistir el cambio en Google Sheets mediante el endpoint PATCH
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, nuevaColumnaId: newColumnId }),
      });
      if (!res.ok) throw new Error("Error al mover la tarea");
    } catch {
      // Rollback si la API falla
      if (prevColumn) {
        lastPersisted.current[taskId] = prevColumn;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, columnaId: prevColumn } : t,
          ),
        );
      }
    }
  };

  // Crear tarea
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || creating || !selectedCol) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: newTitle,
          descripcion: newDesc,
          columnaId: selectedCol,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        loadTasks();
      }
    } finally {
      setCreating(false);
    }
  };

  // Crear columna
  const handleAddColumn = async () => {
    if (!newColName.trim() || busyCol) return;

    setBusyCol(true);
    try {
      const res = await fetch("/api/scrum/task-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newColName, color: newColColor }),
      });

      if (res.ok) {
        setNewColName("");
        setNewColColor("blue");
        setCreatingCol(false);
        loadColumns();
      }
    } finally {
      setBusyCol(false);
    }
  };

  // Renombrar columna
  const handleRenameColumn = async (columnId: string, nombre: string) => {
    await fetch("/api/scrum/task-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: columnId, nombre }),
    });
    loadColumns();
  };

  // Mover columna (reordenar)
  const handleMoveColumn = async (columnId: string, direction: -1 | 1) => {
    const idx = columns.findIndex((c) => c.id === columnId);
    const target = idx + direction;
    if (idx === -1 || target < 0 || target >= columns.length) return;

    await fetch("/api/scrum/task-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: columnId, orden: target }),
    });
    loadColumns();
  };

  // Eliminar columna (bloqueada por el servidor si tiene tareas)
  const handleDeleteColumn = async (columnId: string) => {
    const res = await fetch("/api/scrum/task-status", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: columnId }),
    });

    const json = await res.json();
    if (!json.success) {
      alert(json.error || "No se pudo eliminar la columna");
      return;
    }

    loadAll();
  };

  return (
    <>
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted border border-border">
          <ListTodo className="size-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-semibold leading-none">
            Tareas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arrastra las tarjetas entre columnas para actualizar su estado.
          </p>
        </div>
      </div>

      {/* Formulario para crear tareas */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva tarea</CardTitle>
          <CardDescription>
            {columns.length > 0
              ? "Se creará en la columna seleccionada."
              : "Crea primero una columna para poder añadir tareas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAddTask}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Input
              type="text"
              placeholder="Título de la tarea..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Descripción (opcional)..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              disabled={columns.length === 0}
              className="h-8 w-full sm:w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.nombre}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              disabled={creating || columns.length === 0}
              className="sm:w-auto"
            >
              <Plus data-slot="icon" />
              {creating ? "Creando..." : "Añadir tarea"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tablero */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto items-start">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2.5 bg-muted/40 p-3.5 rounded-xl w-80 min-h-[550px] border border-border/60 shrink-0"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 items-start pb-2">
          <KanbanBoard
            tasks={tasks}
            columns={columns}
            onColumnChange={handleColumnChange}
            onRenameColumn={handleRenameColumn}
            onMoveColumn={handleMoveColumn}
            onDeleteColumn={handleDeleteColumn}
          />

          {/* Tarjeta para crear una nueva columna */}
          {creatingCol ? (
            <Card className="w-80 shrink-0 border-dashed">
              <CardHeader>
                <CardTitle>Nueva columna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Nombre de la columna..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                  }}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {COLUMN_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      aria-label={c.name}
                      onClick={() => setNewColColor(c.name)}
                      className={cn(
                        "size-6 rounded-full border-2 transition-transform hover:scale-110",
                        c.swatch,
                        newColColor === c.name
                          ? "border-foreground"
                          : "border-transparent",
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCreatingCol(false);
                      setNewColName("");
                      setNewColColor("blue");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddColumn}
                    disabled={!newColName.trim() || busyCol}
                  >
                    <PlusIcon data-slot="icon" />
                    Crear columna
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingCol(true)}
              className="w-80 shrink-0 min-h-[550px] rounded-xl border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <PlusIcon className="size-5" />
              <span className="text-sm font-medium">Nueva columna</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
