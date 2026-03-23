
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                surface: "var(--surface)",
                "surface-hover": "var(--surface-hover)",
                accent: "var(--accent)",
                "accent-secondary": "var(--accent-secondary)",
                "accent-glow": "var(--accent-glow)",
                text: "var(--text)",
                "text-muted": "var(--text-muted)",
                border: "var(--border)",
                "grid-color": "var(--grid-color)",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
