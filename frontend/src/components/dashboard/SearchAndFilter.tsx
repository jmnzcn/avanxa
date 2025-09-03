import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Search, X, Target, Calendar, Star, TrendingUp } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: string[]) => void;
  onSortChange: (sortBy: string) => void;
  className?: string;
}

export function SearchAndFilter({
  onSearch,
  onFilterChange,
  onSortChange,
  className,
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOption[]>([
    {
      id: "active",
      label: "Activos",
      icon: <Target className="h-4 w-4" />,
      active: true,
    },
    {
      id: "completed",
      label: "Completados",
      icon: <Calendar className="h-4 w-4" />,
      active: false,
    },
    {
      id: "favorites",
      label: "Favoritos",
      icon: <Star className="h-4 w-4" />,
      active: false,
    },
    {
      id: "trending",
      label: "En Tendencia",
      icon: <TrendingUp className="h-4 w-4" />,
      active: false,
    },
  ]);
  const [sortBy, setSortBy] = useState("recent");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleFilter = (filterId: string) => {
    const updatedFilters = filters.map((filter) =>
      filter.id === filterId ? { ...filter, active: !filter.active } : filter
    );
    setFilters(updatedFilters);

    const activeFilters = updatedFilters
      .filter((filter) => filter.active)
      .map((filter) => filter.id);
    onFilterChange(activeFilters);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    onSortChange(newSortBy);
  };

  const clearAllFilters = () => {
    const updatedFilters = filters.map((filter) => ({
      ...filter,
      active: false,
    }));
    setFilters(updatedFilters);
    onFilterChange([]);
  };

  const activeFiltersCount = filters.filter((f) => f.active).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Buscar y Filtrar</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""}{" "}
              activo{activeFiltersCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar hábitos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => handleSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filtros</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar todo
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter.id)}
                className="flex items-center space-x-2"
              >
                {filter.icon}
                <span>{filter.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Ordenar por</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("recent")}
            >
              Más Recientes
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("name")}
            >
              Nombre A-Z
            </Button>
            <Button
              variant={sortBy === "streak" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("streak")}
            >
              Racha Más Larga
            </Button>
            <Button
              variant={sortBy === "completion" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("completion")}
            >
              Tasa de Finalización
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
