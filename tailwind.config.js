
module.exports = {
    content: [
        "./src/app*.{js,ts,jsx,tsx,mdx}",
        "./src/components*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                surface: "var(--surface)",
                accent: "var(--accent)",
                text: "var(--text)",
                "text-muted": "var(--text-muted)",
            },
        },
    },
    plugins: [],
}
