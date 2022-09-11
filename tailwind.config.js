/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './screens/**/*.{html,js,tsx,ts}',
        './components/**/*.{html,js,tsx,ts}',
        './fields/**/*.{html,js,tsx,ts}',
        'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    ],
    safelist: [
        'w-64',
        'w-1/2',
        'rounded-l-lg',
        'rounded-r-lg',
        'bg-gray-200',
        'grid-cols-4',
        'grid-cols-7',
        'h-6',
        'leading-6',
        'h-9',
        'leading-9',
        'shadow-lg',
    ],
    theme: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Inter', 'serif'],
        },
        extend: {
            colors: {
                'cues-blue': '#0067ff',
                'cues-gray-1': '#f7f7f9',
                'cues-gray-2': '#dcdddf',
                'cues-border': '#e8eaee',
                'cues-gray-text': '#76787c',
                'cues-border-dark': '#444444',
            },
            backgroundColor: {
                'cues-blue': '#0067ff',
                // Light
                'cues-gray-1': '#f7f7f9',
                // Dark
                'cues-gray-2': '#dcdddf',
                'cues-border': '#e8eaee',
                // Light (DARK THEME) (HOVER STATE BEST CHOICE)
                'cues-dark-1': '#383838',
                // Darker (DARK THEME) (ACTIVE STATE)
                'cues-dark-active': '#4a5878',
                // Dark (DARK THEME)
                'cues-dark-2': '#19171D',
                // Dark (Content Area Slack)
                'cues-dark-3': '#1B1D21',
            },
            divideColor: {
                'cues-divide': '#e8eaee',
                'cues-divide-dark': '#444444',
            },
            ringColor: {
                'cues-dark-3': '#1B1D21',
            },
            minWidth: {
                'cues-carousel': '18em',
                kanban: '28rem',
            },
            minHeight: {
                coursework: 'calc(100vh - 56px)',
            },
        },
    },
    darkMode: 'class',
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
        require('@tailwindcss/line-clamp'),
        require('flowbite/plugin'),
    ],
};
