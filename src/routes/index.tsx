import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { Panel } from "@/studio/Panel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [View, setView] = useState<ComponentType | null>(null);
  useEffect(() => {
    let alive = true;
    void import("@/studio/Scene").then((mod) => {
      if (alive) setView(() => mod.Scene);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="studio-shell">
      <Panel />
      <div className="stage">{View ? <View /> : <p className="boot">استودیو در حال بالا آمدن است…</p>}</div>
    </main>
  );
}
