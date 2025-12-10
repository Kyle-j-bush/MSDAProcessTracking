/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#512888', // K-State Purple
                'primary-dark': '#3a1c63',
                secondary: '#D1D1D1', // Silver/Gray
                'brand-green': '#10B981',
                'brand-red': '#EF4444',
            }
        },
    },
    plugins: [],
}
