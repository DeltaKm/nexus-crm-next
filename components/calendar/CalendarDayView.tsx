import React from "react";
import { format, isSameDay } from "date-fns";
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

type CalendarDayViewProps = {
  date: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
};

const CalendarDayView = ({ date, events, onEventClick }: CalendarDayViewProps) => {
  // Filter events for the selected day
  const dayEvents = events.filter(event => 
    isSameDay(event.date, date)
  );

  // Group events by hour
  const eventsByHour: Record<number, Event[]> = {};
  dayEvents.forEach(event => {
    const hour = event.date.getHours();
    if (!eventsByHour[hour]) {
      eventsByHour[hour] = [];
    }
    eventsByHour[hour].push(event);
  });

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="border rounded-md">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">
          {format(date, "EEEE, d MMMM yyyy", { locale: it })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventi'} in programma
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {hours.map(hour => {
          const hourEvents = eventsByHour[hour] || [];
          
          return (
            <div key={hour} className="flex border-b">
              <div className="w-16 p-2 text-sm text-muted-foreground text-right border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2 min-h-[3rem]">
                {hourEvents.length > 0 ? (
                  <div className="space-y-1">
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-2 rounded-md cursor-pointer flex items-center gap-2 text-sm",
                          event.type === "deadline" ? "bg-red-100 hover:bg-red-200 text-red-800" :
                          event.type === "task" && event.priority === "high" ? "bg-red-100 hover:bg-red-200 text-red-800" :
                          event.type === "task" && event.priority === "medium" ? "bg-amber-100 hover:bg-amber-200 text-amber-800" :
                          event.type === "task" ? "bg-green-100 hover:bg-green-200 text-green-800" :
                          "bg-blue-100 hover:bg-blue-200 text-blue-800"
                        )}
                        onClick={() => onEventClick(event)}
                      >
                        {event.type === "deadline" && <Clock className="h-4 w-4 flex-shrink-0" />}
                        {event.type === "task" && <ListTodo className="h-4 w-4 flex-shrink-0" />}
                        {event.type === "meeting" && <CalendarIcon className="h-4 w-4 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {event.amount && (
                            <div className="text-xs opacity-75">€{event.amount}</div>
                          )}
                        </div>
                        <div className="text-xs">
                          {format(event.date, "HH:mm", { locale: it })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">-</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {dayEvents.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nessun evento in programma per oggi</p>
        </div>
      )}
    </div>
  );
};

export default CalendarDayView;
