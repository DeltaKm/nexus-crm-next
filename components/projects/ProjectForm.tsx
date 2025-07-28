"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"

import { projectFormSchema, type ProjectFormValues } from "@/lib/validations/project"

interface Client {
  id: string
  name: string
  company?: string | null
}

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>
  onSubmit: (data: ProjectFormValues) => void
  isSubmitting: boolean
}

export function ProjectForm({ defaultValues, onSubmit, isSubmitting }: ProjectFormProps) {
  // @ts-ignore - Ignora errori di tipo con zodResolver
  const form = useForm<ProjectFormValues>({
    // @ts-ignore - Ignora errori di tipo con zodResolver
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      startDate: "",
      endDate: "",
      status: "planning",
      budget: null,
      notes: "",
      completed: 0,
      repository: "",
      ...defaultValues,
    },
  })

  // Fetch clients for the dropdown
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei clienti")
      }
      return response.json()
    },
  })

  return (
    <Form {...form}>
      {/* @ts-ignore - Ignora errori di tipo con form.handleSubmit */}
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Progetto *</FormLabel>
              <FormControl>
                <Input placeholder="Inserisci il nome del progetto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrizione del progetto" 
                  className="resize-none min-h-[100px]" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Inizio *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString() : "")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fine *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString() : "")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona lo stato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planning">Pianificazione</SelectItem>
                    <SelectItem value="in-progress">In Corso</SelectItem>
                    <SelectItem value="review">Revisione</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="on-hold">In Pausa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Inserisci il budget" 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="repository"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository</FormLabel>
              <FormControl>
                <Input 
                  placeholder="URL del repository" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentuale Completamento: {field.value}%</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  defaultValue={[field.value]}
                  onValueChange={(values: number[]) => field.onChange(values[0])}
                  className="py-4"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore - Ignora errori di tipo duplicati in react-hook-form
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Note aggiuntive" 
                  className="resize-none min-h-[100px]" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
