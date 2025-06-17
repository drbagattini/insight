"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";

interface Section {
  id: string;
  label: string;
}

interface AnchorNavProps {
  sections: ReadonlyArray<Section>;
}

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-40% 0px -60% 0px",
        threshold: 0,
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

export default function AnchorNav({ sections }: AnchorNavProps) {
  const active = useScrollSpy(sections.map((s) => s.id));
  return (
    <nav className="sticky top-24 space-y-1 text-sm">
      {sections.map((s) => (
        <Link
          key={s.id}
          href={`#${s.id}`}
          className={clsx(
            "block transition-colors",
            active === s.id
              ? "text-blue-600 font-medium"
              : "text-gray-600 hover:text-blue-600"
          )}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
