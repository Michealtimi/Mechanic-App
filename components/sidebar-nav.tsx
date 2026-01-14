"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Home,
  Zap,
  MapPin,
  Wallet,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Determine which nav items to show based on user type
  const customerNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    { label: "My Bookings", href: "/dashboard/bookings", icon: <Calendar size={20} /> },
    { label: "Find Mechanic", href: "/dashboard/find-mechanic", icon: <Wrench size={20} /> },
    { label: "My Garage", href: "/dashboard/garage", icon: <Zap size={20} /> },
    { label: "Live Tracking", href: "/dashboard/live-tracking", icon: <MapPin size={20} /> },
    { label: "Wallet", href: "/dashboard/wallet", icon: <Wallet size={20} /> },
    { label: "Services", href: "/dashboard/services", icon: <ShieldCheck size={20} /> },
  ]

  const mechanicNav: NavItem[] = [
    { label: "Dashboard", href: "/mechanic/dashboard", icon: <Home size={20} /> },
    { label: "Active Jobs", href: "/mechanic/dashboard", icon: <Zap size={20} /> },
    { label: "Profile", href: "/mechanic/profile", icon: <Users size={20} /> },
    { label: "Payouts", href: "/mechanic/payout-history", icon: <Wallet size={20} /> },
    { label: "Settings", href: "/mechanic/profile/settings", icon: <Settings size={20} /> },
  ]

  const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <Home size={20} /> },
    { label: "Campaigns", href: "/admin/campaigns", icon: <BarChart3 size={20} /> },
    { label: "Promotions", href: "/admin/promotions", icon: <Zap size={20} /> },
    { label: "Verification", href: "/admin/merchant-verification", icon: <ShieldCheck size={20} /> },
    { label: "Analytics", href: "/admin/demand-analytics", icon: <MapPin size={20} /> },
    { label: "System Health", href: "/admin/system-health", icon: <Settings size={20} /> },
  ]

  // Get nav items based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return customerNav
    if (user.role === "admin") return adminNav
    if (user.role === "mechanic") return mechanicNav
    return customerNav
  }

  const navItems = getNavItems()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 z-40 lg:translate-x-0 lg:relative ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo/Branding */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <Wrench size={20} className="text-primary-foreground font-bold" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sidebar-foreground font-bold text-lg">AutoServe</h1>
              <p className="text-muted-foreground text-xs">Professional Auto Care</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-border hover:text-sidebar-foreground"
                }`}
              >
                <span className={active ? "text-sidebar-primary-foreground" : "group-hover:text-primary"}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs px-2 py-1 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
