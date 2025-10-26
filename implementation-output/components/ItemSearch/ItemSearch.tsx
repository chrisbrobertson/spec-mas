import React, { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Person } from "@/types/person";
import "./ItemSearch.css";

interface ItemSearchProps {
  onSearch: (params: SearchParams) => void;
  persons: Person[];
  includeArchived?: boolean;
}

interface SearchParams {
  query: string;
  priority?: "low" | "medium" | "high";
  person?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  source?: "email" | "slack" | "zoom";
  dateRange?: { from: Date; to: Date };
  includeArchived: boolean;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({
  onSearch,
  persons,
  includeArchived = false,
}) => {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<SearchParams["priority"]>();
  const [selectedPerson, setSelectedPerson] = useState<string>();
  const [status, setStatus] = useState<SearchParams["status"]>();
  const [source, setSource] = useState<SearchParams["source"]>();
  const [showArchived, setShowArchived] = useState(includeArchived);

  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(() => {
    onSearch({
      query: debouncedQuery,
      priority,
      person: selectedPerson,
      status,
      source,
      includeArchived: showArchived,
    });
  }, [
    debouncedQuery,
    priority,
    selectedPerson,
    status,
    source,
    showArchived,
    onSearch,
  ]);

  const handleReset = useCallback(() => {
    setQuery("");
    setPriority(undefined);
    setSelectedPerson(undefined);
    setStatus(undefined);
    setSource(undefined);
    setShowArchived(false);
    onSearch({ query: "", includeArchived: false });
  }, [onSearch]);

  const sortedPersons = useMemo(
    () => [...persons].sort((a, b) => a.name.localeCompare(b.name)),
    [persons],
  );

  const isFiltered = useMemo(
    () =>
      query || priority || selectedPerson || status || source || showArchived,
    [query, priority, selectedPerson, status, source, showArchived],
  );

  return (
    <div
      className="item-search"
      role="search"
      aria-label="Search tracked items"
    >
      <div className="item-search__main">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="item-search__input"
          placeholder="Search by title or description..."
          aria-label="Search query"
        />

        <select
          value={priority || ""}
          onChange={(e) =>
            setPriority(e.target.value as SearchParams["priority"])
          }
          className="item-search__select"
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={selectedPerson || ""}
          onChange={(e) => setSelectedPerson(e.target.value)}
          className="item-search__select"
          aria-label="Filter by person"
        >
          <option value="">All People</option>
          {sortedPersons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <select
          value={status || ""}
          onChange={(e) => setStatus(e.target.value as SearchParams["status"])}
          className="item-search__select"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={source || ""}
          onChange={(e) => setSource(e.target.value as SearchParams["source"])}
          className="item-search__select"
          aria-label="Filter by source"
        >
          <option value="">All Sources</option>
          <option value="email">Email</option>
          <option value="slack">Slack</option>
          <option value="zoom">Zoom</option>
        </select>

        <label className="item-search__checkbox-label">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="item-search__checkbox"
          />
          Include Archived
        </label>

        <button
          onClick={handleSearch}
          className="item-search__button item-search__button--search"
          aria-label="Apply search filters"
        >
          Search
        </button>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="item-search__button item-search__button--reset"
            aria-label="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
