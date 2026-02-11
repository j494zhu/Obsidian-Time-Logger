
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function saveNote(type, content, statusId) {
    const statusSpan = document.getElementById(statusId);
    statusSpan.innerText = "Saving...";
    
    fetch('/save_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, content: content }),
    })
    .then(response => response.json())
    .then(data => {
        statusSpan.innerText = "Saved at " + data.saved_at;
    })
    .catch((error) => {
        console.error('Error:', error);
        statusSpan.innerText = "Error!";
    });
}

const quickInput = document.getElementById('quick_note_area');
const bookInput = document.getElementById('notebook_area');

if(quickInput) {
    quickInput.addEventListener('input', debounce(function() {
        saveNote('quick_note', this.value, 'status-quick');
    }, 1000));
}

if(bookInput) {
    bookInput.addEventListener('input', debounce(function() {
        saveNote('notebook', this.value, 'status-book');
    }, 1000));
}

