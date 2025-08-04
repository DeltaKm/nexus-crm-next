import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays } from "date-fns";
import { it } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Clock, ListTodo } from "lucide-react";

type Event = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "deadline" | "meeting";
  priority?: "low" | "medium" | "high";
  amount?: number;
};

type CalendarMonthViewProps = {
  date: Date;
  events: Event[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: Event) => void;
};

const CalendarMonthView = ({ date, events, onSelectDate, onEventClick }: CalendarMonthViewProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add days before the start of the month to align with week start (Monday)
  const startDay = monthStart.getDay() || 7; // Convert Sunday (0) to 7
  const leadingDays = startDay > 1 ? Array(startDay - 1).fill(null).map((_, i) => addDays(monthStart, -(startDay - 1) + i)) : [];
  
  // Add trailing days to complete the last week
  const endDay = monthEnd.getDay() || 7;
  const trailingDays = endDay < 7 ? Array(7 - endDay).fill(null).map((_, i) => addDays(monthEnd, i + 1)) : [];
  
  // Combine all days
  const calendarDays = [...leadingDays, ...daysInMonth, ...trailingDays];
  
  // Generate weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  
  // Initialize
  calendarDays.forEach(day => {
    if (day) {
      const dateKey = format(day, "yyyy-MM-dd");
      eventsByDate[dateKey] = [];
    }
  });
  
  // Add events
  events.forEach(event => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    if (eventsByDate[dateKey]) {
      eventsByDate[dateKey].push(event);
    }
  });
  
  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="border rounded-md">
      {/* Header with day names */}
      <div className="grid grid-cols-7 gap-px bg-muted text-center">
        {dayNames.map((day) => (
          <div key={day} className="bg-background p-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="divide-y">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-px bg-muted">
            {week.map((day, dayIndex) => {
              if (!day) return <div key={dayIndex} className="bg-background h-24"></div>;
              
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, date);
              const isSelected = isSameDay(day, date);
              const isTodayDate = isToday(day);
              
              return (
                <div 
                  key={dayIndex} 
                  className={cn(
                    "bg-background h-24 p-1 overflow-y-auto cursor-pointer hover:bg-accent/5",
                    isSelected ? "ring-2 ring-primary" : "",
                    !isCurrentMonth ? "opacity-50" : ""
                  )}
                  onClick={(e) => {
                    // Prevent click on day when clicking on an event
                    if (!(e.target as HTMLElement).closest('[data-event-item]')) {
                      onSelectDate(day);
                    }
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "flex items-center justify-center h-6 w-6 text-xs rounded-full",
                      isTodayDate ? "bg-primary text-primary-foreground font-medium" : ""
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs font-medium text-primary">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div 
                        key={event.id} 
                        className={cn(
                          "text-xs p-1 rounded flex items-center gap-1 truncate cursor-pointer",
                          event.type === "deadline" ? "bg-red-100 hover:bg-red-200" :
                          event.type === "task" && event.priority === "high" ? "bg-red-100 hover:bg-red-200" :
                          event.type === "task" && event.priority === "medium" ? "bg-amber-100 hover:bg-amber-200" :
                          event.type === "task" ? "bg-green-100 hover:bg-green-200" :
                          "bg-blue-100 hover:bg-blue-200"
                        )}
                        data-event-item
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {event.type === "deadline" && <Clock className="h-3 w-3 text-red-600 flex-shrink-0" />}
                        {event.type === "task" && <ListTodo className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                        {event.type === "meeting" && <Clock className="h-3 w-3 text-green-600 flex-shrink-0" />}
                        <span className="truncate">
                          {event.title}
                          {event.amount && ` - €${event.amount}`}
                        </span>
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} altri
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonthView;
