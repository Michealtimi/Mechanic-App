"use client"

import { useTheme } from "./theme-provider"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Sparkles } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2 p-1 bg-card rounded-lg border border-border">
      <Button
        variant={theme === "dark-green" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark-green")}
        className="gap-2"
      >
        <Moon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Dark</span>
      </Button>

      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="gap-2"
      >
        <Sun className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Light</span>
      </Button>

      <Button
        variant={theme === "premium" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("premium")}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Premium</span>
      </Button>
    </div>
  )
}
