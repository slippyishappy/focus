/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./src/popup.html", "./*.html", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
      extend: {
        fontFamily: {
          inter: [
            "Inter",
            "ui-sans-serif",
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
          ],
        },
        colors: {
          modern: {
            50: "#f7f6f3",
            100: "#f1f0ec",
            200: "#e6e4dd",
            300: "#d0cdc4",
            400: "#b8b4a8",
            500: "#a5a096",
            600: "#8e8a7e",
            700: "#6f6b5f",
            800: "#5a5650",
            900: "#4a4641",
          },
          // shadcn/ui color system
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        animation: {
          "slide-in": "slideIn 0.2s ease-out",
          "fade-in": "fadeIn 0.15s ease-out",
          "slide-up": "slideUp 0.2s ease-out",
          "scale-in": "scaleIn 0.15s ease-out",
        },
        keyframes: {
          slideIn: {
            "0%": { opacity: "0", transform: "translateY(-8px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          fadeIn: {
            "0%": { opacity: "0" },
            "100%": { opacity: "1" },
          },
          slideUp: {
            "0%": { opacity: "0", transform: "translateY(10px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          scaleIn: {
            "0%": { opacity: "0", transform: "scale(0.95)" },
            "100%": { opacity: "1", transform: "scale(1)" },
          },
        },
      },
    },
    plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
  }
