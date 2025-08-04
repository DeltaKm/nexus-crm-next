"use client"

import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  Home, 
  Users, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Clock, 
  Calendar,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  User
} from "lucide-react"
import { ChevronDoubleRightIcon } from "@heroicons/react/24/solid"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clienti", href: "/clients", icon: Users },
  { name: "Progetti", href: "/projects", icon: Briefcase },
  { name: "Task", href: "/tasks", icon: CheckSquare },
  { name: "Fatture", href: "/invoices", icon: FileText },
  { name: "Time Tracking", href: "/time-entries", icon: Clock },
  { name: "Scadenziario", href: "/deadlines", icon: Calendar },
  { name: "Calendario", href: "/calendar", icon: CalendarDays },
]

// Voci di menu in arrivo (non cliccabili)
const comingSoonNavigation = [
  { name: "Comunicazioni", icon: MessageSquare },
  { name: "Report", icon: BarChart3 },
]

// Voci di menu visibili solo per admin e superadmin
const adminNavigation = [
  { name: "Utenti", href: "/users", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  
  // Debug: visualizza informazioni sulla sessione nella console
  console.log("Session in Sidebar:", session)
  console.log("User role:", session?.user?.role)

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
            <ChevronDoubleRightIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Nexus CRM</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0",
                      isActive ? "text-blue-700" : "text-gray-400"
                    )}
                  />
                  {item.name}
                </Button>
              </li>
            )
          })}
          
          {/* Coming Soon Navigation */}
          <div className="mt-6 mb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">In Arrivo</p>
          </div>
          {comingSoonNavigation.map((item) => (
            <li key={item.name}>
              <div className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5 shrink-0 text-gray-300" />
                  {item.name}
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                  soon
                </span>
              </div>
            </li>
          ))}

          {/* Admin Navigation - visibile solo per admin e superadmin */}
          
          {/* Condizione esplicita per admin/superadmin (case-insensitive) */}
          {session?.user?.role && (session.user.role.toLowerCase() === "admin" || session.user.role.toLowerCase() === "superadmin") && (
            <>
              <div className="mt-6 mb-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amministrazione</p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 shrink-0",
                          isActive ? "text-blue-700" : "text-gray-400"
                        )}
                      />
                      {item.name}
                    </Button>
                  </li>
                )
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User section */}
      {session && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session.user.role?.toLowerCase()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Esci
          </Button>
        </div>
      )}
    </div>
  )
}
