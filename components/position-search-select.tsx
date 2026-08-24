"use client";

import { useEffect, useMemo, useState } from "react";

interface PositionSearchSelectProps {
  name: string;
  value: string;
  positions: readonly string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

export default function PositionSearchSelect({
  name,
  value,
  positions,
  placeholder = "Search positions",
  required = false,
  className = "",
  onChange,
}: PositionSearchSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredPositions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return positions.filter((position) =>
      position.toLowerCase().includes(normalizedQuery),
    );
  }, [positions, query]);

  return (
    <div className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        required={required && !value}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          if (event.target.value !== value) onChange("");
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
          {filteredPositions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No listed positions match your search.
            </p>
          ) : (
            filteredPositions.map((position) => (
              <button
                key={position}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(position);
                  setQuery(position);
                  setOpen(false);
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {position}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
