const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const submitButton = document.getElementById("submit-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const notesList = document.getElementById("notes-list");
const statusMessage = document.getElementById("status");

let notes = [];
let nextClientId = 0;

function createClientId() {
  nextClientId += 1;
  return `note-${Date.now()}-${nextClientId}`;
}

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function setBusy(isBusy) {
  loadButton.disabled = isBusy;
  submitButton.disabled = isBusy;
  notesList.querySelectorAll("button").forEach(button => {
    button.disabled = isBusy;
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: HTTP ${response.status}`);
  }

  const text = await response.text();

  return {
    data: text ? JSON.parse(text) : null,
    status: response.status
  };
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No notes yet. Load notes or create one.";
    notesList.appendChild(item);
    return;
  }

  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note";

    const heading = document.createElement("h3");
    heading.textContent = note.title || "(Untitled note)";

    const body = document.createElement("p");
    body.textContent = note.body || "(No body provided)";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "note-delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteNote(note, deleteButton);
    });

    item.append(heading, body, deleteButton);
    notesList.appendChild(item);
  }
}

async function loadNotes() {
  setBusy(true);
  showStatus("Loading notes...");

  try {
    const result = await request(`${API_URL}?_limit=10`);
    if (!Array.isArray(result.data)) {
      throw new Error("The API returned an unexpected response.");
    }

    notes = result.data.map(note => ({
      ...note,
      clientId: createClientId()
    }));
    renderNotes();
    showStatus(`Loaded ${notes.length} notes.`, "success");
  } catch (error) {
    showStatus(`Unable to load notes: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  showStatus("Creating note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1
      })
    });

    const createdNote = result.data;
    if (!createdNote || createdNote.id == null) {
      throw new Error("The API did not return a note ID.");
    }

    createdNote.clientId = createClientId();
    notes.unshift(createdNote);
    renderNotes();
    noteForm.reset();

    showStatus(
      `Note created successfully. ID: ${createdNote.id}`,
      "success"
    );
  } catch (error) {
    showStatus(`Unable to create note: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteNote(note, button) {
  setBusy(true);
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    await request(`${API_URL}/${encodeURIComponent(note.id)}`, {
      method: "DELETE"
    });

    notes = notes.filter(item => item.clientId !== note.clientId);
    renderNotes();
    showStatus(`Note ${note.id} deleted.`, "success");
  } catch (error) {
    showStatus(`Unable to delete note: ${error.message}`, "error");
    renderNotes();
  } finally {
    setBusy(false);
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

renderNotes();
