(function() {
    const toggle = document.getElementById('dm-toggle');
    const stored = localStorage.getItem('onyx-dark-mode');

    function applyDark(on) {
    document.body.classList.toggle('dark-mode', on);
    toggle.classList.toggle('is-dark', on);
    localStorage.setItem('onyx-dark-mode', on ? '1' : '0');
    }

    // Restore preference on load
    if (stored === '1') applyDark(true);

    // Expose globally for onclick
    window.toggleDarkMode = function() {
    applyDark(!document.body.classList.contains('dark-mode'));
    };
})();