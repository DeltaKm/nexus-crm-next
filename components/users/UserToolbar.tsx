import React from "react"
import { RefreshCcw, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UserToolbarProps {
  onRefresh: () => void
  refreshing: boolean
  onAddUser: () => void
  onFilterChange: (value: string) => void
  filterValue: string
}

export const UserToolbar = ({
  onRefresh,
  refreshing,
  onAddUser,
  onFilterChange,
  filterValue
}: UserToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Gestione Utenti</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          className="ml-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Aggiorna</span>
        </Button>
      </div>
      
      <div className="flex w-full sm:w-auto gap-2">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca utenti..."
            className="pl-8"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>
        
        <Button onClick={onAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>
    </div>
  )
}
