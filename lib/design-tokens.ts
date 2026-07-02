export const designTokens = {
  color: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: "hsl(var(--card))",
    primary: "hsl(var(--primary))",
    accent: "hsl(var(--accent))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))"
  },
  typography: {
    fontSans: "var(--font-sans)",
    hero: "text-4xl md:text-6xl font-semibold",
    title: "text-2xl md:text-3xl font-semibold",
    body: "text-sm leading-6"
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)"
  },
  shadow: {
    soft: "var(--shadow-soft)",
    lift: "var(--shadow-lift)",
    focus: "var(--shadow-focus)"
  },
  spacing: {
    panel: "var(--space-panel)",
    section: "var(--space-section)"
  },
  animation: {
    productive: "var(--ease-productive)",
    premium: "var(--ease-premium)"
  },
  iconRule: {
    library: "lucide-react",
    size: "16px for controls, 20px for navigation, 24px for empty states",
    stroke: "Use 1.75-2px stroke and pair icon-only controls with accessible labels."
  }
} as const;
