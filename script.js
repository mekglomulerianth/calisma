document.addEventListener('DOMContentLoaded', () => {
    // ------------------- TEMA YÖNETİMİ -------------------
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIcon = themeSwitcher.querySelector('span');
    const docElement = document.documentElement;

    function updateIcon() {
        if (docElement.classList.contains('dark-theme')) {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }
    updateIcon();

    themeSwitcher.addEventListener('click', () => {
        docElement.classList.toggle('dark-theme');
        docElement.classList.toggle('light-theme');
        localStorage.setItem('theme', docElement.classList.contains('dark-theme') ? 'dark' : 'light');
        updateIcon();
    });

    // ------------------- ELEMENT SEÇİMİ (STATİK OLANLAR) -------------------
    const addButton = document.getElementById('add-button');
    const popupMenu = document.getElementById('popup-menu');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalSaveButton = document.getElementById('modal-save-button');
    const popupOptions = document.querySelectorAll('.popup-option');
    const contentGrid = document.getElementById('content-grid');

    let editingItem = null; // Düzenlenen DOM öğesini takip et
    let currentModalType = ''; // 'Not Ekle', 'Çalışma Ekle', 'Görev Ekle'

    // ------------------- VERİ YÖNETİMİ -------------------
    const getItems = () => JSON.parse(localStorage.getItem('my-items')) || [];
    const saveItems = (items) => localStorage.setItem('my-items', JSON.stringify(items));

    // ------------------- ARAYÜZ YÖNETİMİ -------------------
    const renderItem = (item) => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('content-item');
        itemElement.dataset.id = item.id;
        itemElement.dataset.type = item.type;

        const titleHTML = `<h3></h3><hr>`;
        let contentHTML = '';

        if (item.type === 'Görev Ekle' && Array.isArray(item.tasks)) {
            const taskListHTML = item.tasks.map((task, index) => `
                <li class="${task.completed ? 'completed' : ''}">
                    <label>
                        <input type="checkbox" class="task-checkbox" data-task-index="${index}" ${task.completed ? 'checked' : ''}>
                        <span class="custom-checkbox"></span>
                        <span class="task-text"></span>
                    </label>
                </li>
            `).join('');
            contentHTML = `<ul class="content-task-list">${taskListHTML}</ul>`;
        } else {
            contentHTML = `<p></p>`;
        }
        
        itemElement.innerHTML = `
            ${titleHTML}
            <div class="item-content-wrapper">${contentHTML}</div>
            <div class="item-actions">
                <button class="item-button edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg></button>
                <button class="item-button delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></button>
            </div>
        `;
        
        // GÜVENLİK İÇİN TEXTCONTENT KULLAN
        itemElement.querySelector('h3').textContent = item.title;
        if (item.type !== 'Görev Ekle') {
            itemElement.querySelector('p').textContent = item.description;
        } else if (Array.isArray(item.tasks)) {
            itemElement.querySelectorAll('.task-text').forEach((span, index) => {
                span.textContent = item.tasks[index].text;
            });
        }
        return itemElement;
    };

    const loadItems = () => {
        contentGrid.innerHTML = '';
        const items = getItems();
        items.forEach(item => contentGrid.appendChild(renderItem(item)));
    };
    
    // ------------------- MODAL YÖNETİMİ -------------------
    const buildModalContent = (type, data) => {
        const titleInputHTML = `<input type="text" id="modal-title-input" placeholder="Başlık" value="${data.title || ''}">`;
        let otherContentHTML = '';

        if (type === 'Görev Ekle') {
            const tasks = data.tasks || [{ text: '', completed: false }];
            const taskInputsHTML = tasks.map(task => `
                <div class="task-item" data-task-id="${task.id || ''}">
                    <input type="text" class="task-text-input" placeholder="Görev açıklaması..." value="${task.text || ''}">
                    <button type="button" class="task-item-delete-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg></button>
                </div>
            `).join('');
            otherContentHTML = `
                <div id="modal-task-container">
                    <div id="task-list">${taskInputsHTML}</div>
                    <button type="button" id="add-task-button" class="add-task-btn">+ Yeni Görev Ekle</button>
                </div>`;
        } else {
            otherContentHTML = `<textarea id="modal-description-input" placeholder="Açıklama...">${data.description || ''}</textarea>`;
        }
        modalContent.innerHTML = titleInputHTML + otherContentHTML;
    };

    function openModal(title, data = {}) {
        currentModalType = data.type || title;
        modalTitle.textContent = title;
        buildModalContent(currentModalType, data);
        modal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
        popupMenu.classList.add('hidden');
        setTimeout(() => modal.querySelector('input, textarea')?.focus(), 100);
    }

    function closeModal() {
        modal.classList.add('hidden');
        modalBackdrop.classList.add('hidden');
    }

    modal.addEventListener('transitionend', () => {
        if (modal.classList.contains('hidden')) {
            editingItem = null;
            modalContent.innerHTML = '';
        }
    });

    // ------------------- EVENT LISTENERS (OLAY DİNLEYİCİLERİ) -------------------
    // POPUP MENÜ
    addButton.addEventListener('click', (event) => {
        event.stopPropagation();
        popupMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
        if (!popupMenu.classList.contains('hidden')) popupMenu.classList.add('hidden');
    });
    popupMenu.addEventListener('click', (event) => event.stopPropagation());
    popupOptions.forEach(option => {
        option.addEventListener('click', () => {
            editingItem = null;
            openModal(option.textContent, { type: option.textContent });
        });
    });

    // KART ETKİLEŞİMLERİ (SİLME, DÜZENLEME, CHECKBOX)
    contentGrid.addEventListener('click', (event) => {
        const itemElement = event.target.closest('.content-item');
        if (!itemElement) return;

        const itemId = itemElement.dataset.id;
        let items = getItems();
        const itemData = items.find(item => String(item.id) === itemId);

        if (event.target.closest('.task-checkbox')) {
            const taskIndex = parseInt(event.target.closest('.task-checkbox').dataset.taskIndex, 10);
            itemData.tasks[taskIndex].completed = !itemData.tasks[taskIndex].completed;
            saveItems(items);
            loadItems();
            return;
        }
        if (event.target.closest('.delete')) {
            saveItems(items.filter(item => String(item.id) !== itemId));
            itemElement.remove();
        }
        if (event.target.closest('.edit')) {
            editingItem = itemElement;
            if (itemData) openModal('Öğeyi Düzenle', itemData);
        }
    });
    
    // MODAL İÇİ ETKİLEŞİMLER (YENİ GÖREV EKLEME, SİLME, ENTER TUŞU)
    modalContent.addEventListener('click', (event) => {
        if (event.target.closest('#add-task-button')) {
            const taskList = modalContent.querySelector('#task-list');
            const newDiv = document.createElement('div');
            newDiv.innerHTML = `<div class="task-item"><input type="text" class="task-text-input" placeholder="Görev açıklaması..."><button type="button" class="task-item-delete-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg></button></div>`;
            taskList.appendChild(newDiv.firstChild);
            taskList.querySelector('.task-item:last-child input').focus();
        }
        if (event.target.closest('.task-item-delete-btn')) {
            event.target.closest('.task-item').remove();
        }
    });
    modalContent.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            if (event.target.matches('input, textarea')) {
                 event.preventDefault();
                 modalSaveButton.click();
            }
        }
    });

    // MODAL KAPATMA VE KAYDETME
    modalCloseButton.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    modalSaveButton.addEventListener('click', () => {
        let items = getItems();
        const title = modalContent.querySelector('#modal-title-input').value.trim();

        if (currentModalType === 'Görev Ekle') {
            const taskElements = Array.from(modalContent.querySelectorAll('.task-item'));
            const originalTasks = editingItem ? (items.find(i => String(i.id) === editingItem.dataset.id)?.tasks || []) : [];

            const tasks = taskElements.map(el => {
                const text = el.querySelector('.task-text-input').value.trim();
                const taskId = el.dataset.taskId;
                const originalTask = taskId ? originalTasks.find(t => String(t.id) === taskId) : null;
                return { id: originalTask?.id || Date.now() + Math.random(), text, completed: originalTask?.completed || false };
            }).filter(task => task.text);

            if (!title && tasks.length === 0) return alert('Lütfen bir başlık veya en az bir görev girin.');
            
            if (editingItem) {
                items = items.map(item => String(item.id) === editingItem.dataset.id ? { ...item, title, tasks } : item);
            } else {
                items.unshift({ id: Date.now(), title, tasks, type: 'Görev Ekle' });
            }
        } else {
            const description = modalContent.querySelector('#modal-description-input').value.trim();
            if (!title && !description) return alert('Lütfen bir başlık veya açıklama girin.');
            
            if (editingItem) {
                items = items.map(item => String(item.id) === editingItem.dataset.id ? { ...item, title, description } : item);
            } else {
                items.unshift({ id: Date.now(), title, description, type: currentModalType });
            }
        }

        saveItems(items);
        loadItems();
        closeModal();
    });

    // ------------------- BAŞLANGIÇ YÜKLEMESİ -------------------
    loadItems();
}); 