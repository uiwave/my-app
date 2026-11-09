"use client";

import { useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban/board";

export default function page() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const json = await res.json();
    if (json.success) setTasks(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <>
      <KanbanBoard />
    </>
  );
}
