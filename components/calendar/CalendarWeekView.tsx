import React from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Clock, ListTodo, Calendar as CalendarIcon } from "lucide-react";

type Event = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "deadline" | "meeting";
  priority?: "low" | "medium" | "high";
  amount?: number;
};

type CalendarWeekViewProps = {
  date: Date;
  events: Event[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: Event) => void;
};

const CalendarWeekView = ({ date, events, onSelectDate, onEventClick }: CalendarWeekViewProps) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  weekDays.forEach(day => {
    const dateKey = format(day, "yyyy-MM-dd");
    eventsByDate[dateKey] = [];
  });

  events.forEach(event => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    if (eventsByDate[dateKey]) {
      eventsByDate[dateKey].push(event);
    }
  });

  // Generate hours for the time grid
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="border rounded-md">
      {/* Week header */}
      <div className="grid grid-cols-8 gap-px bg-muted">
        <div className="bg-background p-2 text-sm font-medium"></div>
        {weekDays.map(day => (
          <div 
            key={day.toISOString()} 
            className={cn(
              "bg-background p-2 text-center cursor-pointer hover:bg-accent/50",
              isSameDay(day, date) ? "bg-primary/10" : "",
              isToday(day) ? "font-bold text-primary" : ""
            )}
            onClick={() => onSelectDate(day)}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE", { locale: it })}
            </div>
            <div className={cn(
              "text-sm",
              isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto" : ""
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-96 overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 gap-px bg-muted border-b">
            <div className="bg-background p-2 text-xs text-muted-foreground text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              const hourEvents = dayEvents.filter(event => event.date.getHours() === hour);

              return (
                <div 
                  key={`${day.toISOString()}-${hour}`} 
                  className="bg-background p-1 min-h-[2.5rem] relative"
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded mb-1 cursor-pointer flex items-center gap-1 truncate",
                        event.type === "deadline" ? "bg-red-100 hover:bg-red-200 text-red-800" :
                        event.type === "task" && event.priority === "high" ? "bg-red-100 hover:bg-red-200 text-red-800" :
                        event.type === "task" && event.priority === "medium" ? "bg-amber-100 hover:bg-amber-200 text-amber-800" :
                        event.type === "task" ? "bg-green-100 hover:bg-green-200 text-green-800" :
                        "bg-blue-100 hover:bg-blue-200 text-blue-800"
                      )}
                      onClick={() => onEventClick(event)}
                      title={`${event.title} - ${format(event.date, "HH:mm", { locale: it })}`}
                    >
                      {event.type === "deadline" && <Clock className="h-3 w-3 flex-shrink-0" />}
                      {event.type === "task" && <ListTodo className="h-3 w-3 flex-shrink-0" />}
                      {event.type === "meeting" && <CalendarIcon className="h-3 w-3 flex-shrink-0" />}
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-3 bg-muted/30 text-sm text-muted-foreground">
        Settimana dal {format(weekStart, "d", { locale: it })} al {format(weekEnd, "d MMMM yyyy", { locale: it })} - 
        {" "}{events.length} {events.length === 1 ? 'evento' : 'eventi'} in programma
      </div>
    </div>
  );
};

export default CalendarWeekView;
