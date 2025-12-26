/* script.js
   Implements:
   - add, edit, delete records
   - persistence using localStorage
   - validation rules per assignment
   - dynamic vertical scrollbar activation
   - simple client-side search
*/

/* ---------- Constants & DOM refs ---------- */
const form = document.getElementById('student-form');
const nameInput = document.getElementById('studentName');
const idInput = document.getElementById('studentID');
const emailInput = document.getElementById('email');
const contactInput = document.getElementById('contact');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

const tableBody = document.getElementById('tableBody');
const tableContainer = document.getElementById('tableContainer');
const recordCount = document.getElementById('recordCount');
const searchInput = document.getElementById('searchInput');

const ERR_NAME = document.getElementById('errorName');
const ERR_ID = document.getElementById('errorID');
const ERR_EMAIL = document.getElementById('errorEmail');
const ERR_CONTACT = document.getElementById('errorContact');

const STORAGE_KEY = 'student_registration_records_v1';

/* ---------- Local state ---------- */
let students = [];        // array of student objects
let editingIndex = -1;    // -1 if adding, otherwise index in students[] being edited

/* ---------- Utility validators ---------- */
function isValidName(name){
  return /^[A-Za-z\s]+$/.test(name.trim());
}
function isValidNumeric(val){
  return /^[0-9]+$/.test(val.trim());
}
function isValidEmail(email){
  // simple but effective email regex for assignment purposes
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isValidContact(contact){
  return /^[0-9]{10,}$/.test(contact.trim()); // at least 10 digits
}

/* ---------- Persistence ---------- */
function loadFromStorage(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) students = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load from storage', e);
    students = [];
  }
}
function saveToStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

/* ---------- Rendering ---------- */
function renderTable(filter = ''){
  tableBody.innerHTML = '';
  const q = filter.trim().toLowerCase();

  const filtered = students.filter(s => {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.studentID.toLowerCase().includes(q);
  });

  filtered.forEach((s, idx) => {
    const tr = document.createElement('tr');

    const indexTd = document.createElement('td');
    indexTd.textContent = (idx + 1);
    tr.appendChild(indexTd);

    const nameTd = document.createElement('td');
    nameTd.textContent = s.name;
    tr.appendChild(nameTd);

    const idTd = document.createElement('td');
    idTd.textContent = s.studentID;
    tr.appendChild(idTd);

    const emailTd = document.createElement('td');
    emailTd.textContent = s.email;
    tr.appendChild(emailTd);

    const contactTd = document.createElement('td');
    contactTd.textContent = s.contact;
    tr.appendChild(contactTd);

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-btn';

    const editBtn = document.createElement('button');
    editBtn.className = 'action edit';
    editBtn.textContent = 'Edit';
    editBtn.title = 'Edit this record';
    editBtn.addEventListener('click', () => startEdit(students.indexOf(s)));
    actionsTd.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'action delete';
    delBtn.textContent = 'Delete';
    delBtn.title = 'Delete this record';
    delBtn.addEventListener('click', () => deleteRecord(students.indexOf(s)));
    actionsTd.appendChild(delBtn);

    tr.appendChild(actionsTd);
    tableBody.appendChild(tr);
  });

  // Update record count
  recordCount.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  // Dynamically add vertical scrollbar if contents overflow
  requestAnimationFrame(() => {
    // Add overflow-y if content overflows container's visible area
    if (tableContainer.scrollHeight > tableContainer.clientHeight) {
      tableContainer.style.overflowY = 'auto';
    } else {
      tableContainer.style.overflowY = 'hidden';
    }
  });
}

/* ---------- CRUD operations ---------- */
function addRecord(student){
  // push new record at start for better visibility
  students.unshift(student);
  saveToStorage();
  renderTable(searchInput.value);
}

function updateRecord(index, student){
  students[index] = student;
  saveToStorage();
  renderTable(searchInput.value);
}

/* Delete by index in students[] (not filtered index) */
function deleteRecord(index){
  if (!confirm('Are you sure you want to delete this record?')) return;
  students.splice(index, 1);
  saveToStorage();
  // if currently editing this item, reset form
  if (editingIndex === index) {
    cancelEdit();
  }
  renderTable(searchInput.value);
}

/* ---------- Editing flow ---------- */
function startEdit(index){
  editingIndex = index;
  const s = students[index];
  nameInput.value = s.name;
  idInput.value = s.studentID;
  emailInput.value = s.email;
  contactInput.value = s.contact;
  submitBtn.textContent = 'Update Student';
  submitBtn.setAttribute('aria-label', 'Update Student');
  nameInput.focus();
}

function cancelEdit(){
  editingIndex = -1;
  form.reset();
  clearErrors();
  submitBtn.textContent = 'Add Student';
}

/* ---------- Form handling and validation ---------- */
function clearErrors(){
  ERR_NAME.textContent = '';
  ERR_ID.textContent = '';
  ERR_EMAIL.textContent = '';
  ERR_CONTACT.textContent = '';
}

function validateForm(){
  clearErrors();
  const name = nameInput.value.trim();
  const sid = idInput.value.trim();
  const email = emailInput.value.trim();
  const contact = contactInput.value.trim();

  let valid = true;
  if (!name) {
    ERR_NAME.textContent = 'Name is required.';
    valid = false;
  } else if (!isValidName(name)) {
    ERR_NAME.textContent = 'Name must contain only letters and spaces.';
    valid = false;
  }

  if (!sid) {
    ERR_ID.textContent = 'Student ID is required.';
    valid = false;
  } else if (!isValidNumeric(sid)) {
    ERR_ID.textContent = 'Student ID must contain only numbers.';
    valid = false;
  }

  if (!email) {
    ERR_EMAIL.textContent = 'Email is required.';
    valid = false;
  } else if (!isValidEmail(email)) {
    ERR_EMAIL.textContent = 'Invalid email format.';
    valid = false;
  }

  if (!contact) {
    ERR_CONTACT.textContent = 'Contact number is required.';
    valid = false;
  } else if (!isValidNumeric(contact)) {
    ERR_CONTACT.textContent = 'Contact must contain only digits.';
    valid = false;
  } else if (!isValidContact(contact)) {
    ERR_CONTACT.textContent = 'Contact must be at least 10 digits.';
    valid = false;
  }

  return valid;
}

/* ---------- Events ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const student = {
    // store trimmed values
    name: nameInput.value.trim(),
    studentID: idInput.value.trim(),
    email: emailInput.value.trim(),
    contact: contactInput.value.trim(),
    createdAt: Date.now()
  };

  if (editingIndex > -1) {
    updateRecord(editingIndex, student);
    cancelEdit();
  } else {
    addRecord(student);
    form.reset();
  }
});

resetBtn.addEventListener('click', () => {
  cancelEdit();
});

/* Simple search */
searchInput.addEventListener('input', (e) => {
  renderTable(e.target.value);
});

/* Clear errors on input */
[nameInput, idInput, emailInput, contactInput].forEach(inp => {
  inp.addEventListener('input', () => {
    // remove only the relevant error when the user edits the field
    if (inp === nameInput) ERR_NAME.textContent = '';
    if (inp === idInput) ERR_ID.textContent = '';
    if (inp === emailInput) ERR_EMAIL.textContent = '';
    if (inp === contactInput) ERR_CONTACT.textContent = '';
  });
});

/* Keyboard accessibility: Enter on search should focus table */
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    tableContainer.focus();
  }
});

/* ---------- Init ---------- */
function init(){
  document.getElementById('year').textContent = new Date().getFullYear();
  loadFromStorage();
  renderTable();

  // initial scrollbar decision
  requestAnimationFrame(() => {
    renderTable(searchInput.value || '');
  });
}

// run init
init();

/* ---------- Comments & Notes ----------
 - Data stored in localStorage under STORAGE_KEY; refreshing page will retain records.
 - The table uses unshift to show most recent entries at top (this is a UI choice).
 - The dynamic vertical scrollbar is applied by checking scrollHeight vs clientHeight and toggling overflow-y.
 - Validation is done client-side (as required). For production, server-side validation would also be necessary.
 - No nested folder structure; files are flat: index.html, styles.css, script.js
---------------------------------------- */
