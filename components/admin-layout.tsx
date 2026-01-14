"use client"

import type React from "react"

import { LayoutGrid, Map, Users, DollarSign, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { href: "/admin/demand-analytics", icon: Map, label: "Dispatch Map" },
    { href: "/admin/merchant-verification", icon: Users, label: "Users" },
    { href: "/admin/system-health", icon: DollarSign, label: "Finance" },
  ]

  return (
    <div className="w-full min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">⚡</span>
            </div>
            <span className="text-sidebar-foreground font-bold text-lg">AutoServe</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-border"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
