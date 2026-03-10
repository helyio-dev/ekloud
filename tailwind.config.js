
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
                accent: "var(--accent)",
                text: "var(--text)",
                "text-muted": "var(--text-muted)",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
