/**
 * Simple note storage
 */
const notes = new Map();

function getUserNotes(userId) {
    if (!notes.has(userId)) {
        notes.set(userId, []);
    }
    return notes.get(userId);
}

function addNote(userId, note) {
    const userNotes = getUserNotes(userId);
    userNotes.push({
        id: userNotes.length + 1,
        text: note,
        createdAt: Date.now()
    });
}

function deleteNote(userId, noteId) {
    const userNotes = getUserNotes(userId);
    const index = userNotes.findIndex(n => n.id === noteId);
    if (index > -1) {
        userNotes.splice(index, 1);
        return true;
    }
    return false;
}

function clearNotes(userId) {
    notes.set(userId, []);
}

module.exports = { getUserNotes, addNote, deleteNote, clearNotes };
