(() => {
    const storageKey = "theme";

    function updateToggleButton(mode) {
        const btn = document.getElementById("themeToggle");
        if (!btn) return;
        const isDark = mode === "dark";
        btn.textContent = isDark ? "☀️" : "🌙";
        btn.setAttribute("aria-pressed", String(isDark));
        btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    }

    function applyTheme(mode) {
        document.body.classList.toggle("dark-mode", mode === "dark");
        updateToggleButton(mode);
    }

    function getPreferredTheme() {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }

    function initTheme() {
        const saved = localStorage.getItem(storageKey) || getPreferredTheme();
        applyTheme(saved);

        const btn = document.getElementById("themeToggle");
        if (btn) {
            btn.addEventListener("click", toggleDarkMode);
        }
    }

    window.toggleDarkMode = function toggleDarkMode() {
        const isDark = document.body.classList.contains("dark-mode");
        const next = isDark ? "light" : "dark";
        localStorage.setItem(storageKey, next);
        applyTheme(next);
    };

    document.addEventListener("DOMContentLoaded", initTheme);
})();
