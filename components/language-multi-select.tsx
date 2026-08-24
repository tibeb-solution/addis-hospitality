"use client";

import { useMemo, useState } from "react";

interface LanguageMultiSelectProps {
  name: string;
  value: string[];
  languages: readonly string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
}

export default function LanguageMultiSelect({
  name,
  value,
  languages,
  placeholder = "Search and select languages",
  onChange,
}: LanguageMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filteredLanguages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return languages.filter(
      (language) =>
        !value.includes(language) &&
        language.toLowerCase().includes(normalizedQuery),
    );
  }, [languages, query, value]);

  return (
    <div className="relative">
      {value.map((language) => (
        <input key={language} type="hidden" name={name} value={language} />
      ))}
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => onChange(value.filter((item) => item !== language))}
            className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            title={`Remove ${language}`}
          >
            {language} x
          </button>
        ))}
      </div>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
          {filteredLanguages.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No listed languages match your search.
            </p>
          ) : (
            filteredLanguages.map((language) => (
              <button
                key={language}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange([...value, language]);
                  setQuery("");
                  setOpen(true);
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {language}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
