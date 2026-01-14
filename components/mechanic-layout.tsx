"use client"

import type React from "react"

import { Wrench, Users, Settings, BarChart3, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/mechanic/dashboard", icon: Wrench, label: "Dashboard" },
    { href: "/mechanic/profile/services", icon: BarChart3, label: "Services" },
    { href: "/mechanic/profile/clients", icon: Users, label: "Clients" },
    { href: "/mechanic/profile/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="w-full min-h-screen bg-background pb-20">
      {/* Main Content */}
      <div className="flex-1">{children}</div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-sidebar-border border-t border-primary/20 z-50">
        <div className="flex justify-around items-center py-3 px-4">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-border/80"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
