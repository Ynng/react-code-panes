import { ReactNode } from "react";

export interface ActivityBarItem {
  id: string;
  icon: ReactNode;
  title: string;
}

interface ActivityBarProps {
  items: ActivityBarItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ActivityBar({ items, activeId, onSelect }: ActivityBarProps) {
  return (
    <div className="mosaic-activitybar">
      {items.map((item) => (
        <div
          key={item.id}
          className={`mosaic-activitybar-item${item.id === activeId ? " active" : ""}`}
          title={item.title}
          onClick={() => onSelect(item.id)}
        >
          <span className="mosaic-activitybar-icon">{item.icon}</span>
        </div>
      ))}
    </div>
  );
}
