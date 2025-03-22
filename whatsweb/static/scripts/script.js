let activeChatId;
let socket;

// Функция для отображения сообщений в чате
async function displayMessage(username, message, user_id) {
    const messagesContainer = document.querySelector("#messages");

    const divElem = document.createElement("div");
    divElem.classList.add("message");

    console.log(`Username: ${username}, message: ${message}, user_id: ${user_id}`);
    const currentUser = await fetchCurrentUser()

    if (user_id === await currentUser) {
        divElem.classList.add("sent");
    } else {
        divElem.classList.add("received");
    }

    divElem.innerHTML = `
        <span class="username">${username}</span> 
        <span class="message-text">${message}</span>
    `;

    messagesContainer.appendChild(divElem);
}

// Функция для подключения к WebSocket
function connectToChat(chatId) {

    document.querySelector("#messages").innerHTML = '';

    if (socket) {
        socket.close();
    }
    console.log(`Попытка подключиться к чату с ID: ${chatId}`);
    socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/`);

    socket.onopen = function () {
        console.log("WebSocket подключен");
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.messages) {
            console.log(data.message);
            // Отображение всех сообщений при подключении
            data.messages.forEach(msg => displayMessage(msg.username, msg.message, msg.user_id));
        } else {
            // Отображение только нового сообщения
            displayMessage(data.username, data.message, data.user_id);
        }
    };

    socket.onclose = function () {
        console.log("WebSocket отключен");
    };

    socket.onerror = function (error) {
        console.error("Ошибка WebSocket: ", error);
    };
}

// Подключаемся к WebSocket при выборе чата
document.querySelector("#chatList").addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("chat")) {
        const chatId = e.target.getAttribute("data-chat-id");
        activeChatId = chatId;
        connectToChat(chatId);
    }
});

// Отправка сообщения через WebSocket
document.querySelector("#sendBtn").addEventListener("click", () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket не подключен!");
        return;
    }

    const messageText = document.querySelector("#messageInput").value;
    if (messageText.trim() === "") {
        console.log("Нельзя отправлять пустое сообщение!");
        return;
    }

    socket.send(JSON.stringify({ message: messageText }));
    document.querySelector("#messageInput").value = "";
});

// Получаем CSRF токен для запросов
async function getCsrfToken() {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfToken ? csrfToken[1] : '';
}

// Получаем ID авторизованного пользователя
async function fetchCurrentUser() {
    try {
        const response = await fetch('http://127.0.0.1:8000/current_user/');
        const data = await response.json();
        return data.user_id;
    } catch (error) {
        console.error('Ошибка при получении текущего пользователя: ', error);
        return null;
    }
}

// Получаем список пользователей
async function fetchUsers() {
    try {
        const currentUserId = await fetchCurrentUser();
        if (!currentUserId) {
            console.error("Не удалось получить ID текущего пользователя.");
            return;
        }

        const response = await fetch('http://127.0.0.1:8000/users/');
        const data = await response.json();
        const ulElem = document.body.querySelector('#userList');

        data.forEach(user => {
            if (user.id.toString() !== currentUserId.toString()) {
                const liElem = document.createElement('li');
                liElem.setAttribute('class', 'user');
                liElem.setAttribute('data-user-id', user.id);
                liElem.textContent = user.username;
                ulElem.appendChild(liElem);
            }
        });
    } catch (error) {
        console.error('Ошибка при получении списка пользователей: ', error);
    }
}

// Запуск загрузки данных
fetchUsers();

// Добавляем ивенты иконкам пользователей, чтобы при нажатии на них
// создавался и открывался личный чат с ними
const ulElem = document.body.querySelector('ul');

ulElem.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('user')) {
        const userId = e.target.getAttribute('data-user-id');

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': await getCsrfToken()
            },
            body: JSON.stringify({
                name: e.target.textContent,
                is_group: false,
                users: [userId]
            })
        };

        fetch('http://127.0.0.1:8000/chats/create/', options)
            .then(response => response.json())
            .then(json => {
                activeChatId = json.id;
                console.log(json)
            })
            .catch(error => console.error('Error:', error));
    }
})

// Получение списка чатов
fetch('http://127.0.0.1:8000/chats/')
    .then(response => response.json())
    .then(data => {
        const ulElem = document.body.querySelector('#chatList');

        data.forEach(chat => {
            const liElem = document.createElement('li');
            const spanElem = document.createElement('span');
            liElem.setAttribute('class', 'chat');
            liElem.setAttribute('data-chat-id', chat.id);
            spanElem.classList.add('chat-name');
            spanElem.textContent = chat.name;


            const btnEditElem = document.createElement('button');
            btnEditElem.classList.add('chat-edit');
            btnEditElem.textContent = '✏️';


            const btnDeleteElem = document.createElement('button');
            btnDeleteElem.classList.add('chat-delete');
            btnDeleteElem.textContent = '❌';

            liElem.appendChild(spanElem);
            if (chat.is_group === true) {
                liElem.appendChild(btnEditElem);
                liElem.appendChild(btnDeleteElem);
            } else {liElem.appendChild(btnDeleteElem);}
            ulElem.appendChild(liElem);
        })
    })

// Выбор списка пользователей или чата
document.addEventListener('DOMContentLoaded', () => {
    const toggleUsers = document.getElementById('toggleUsers');
    const toggleChats = document.getElementById('toggleChats');
    const userList = document.getElementById('userList');
    const chatList = document.getElementById('chatList');

    toggleUsers.addEventListener('click', () => {
        userList.style.display = userList.style.display === 'none' ? 'block' : 'none';
    });

    toggleChats.addEventListener('click', () => {
        chatList.style.display = chatList.style.display === 'none' ? 'block' : 'none';
    });
});


// Создание группового чата
const createGroupChatBtn = document.getElementById('createGroupChat');
const createChatModal = document.getElementById('createChatModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const createChatBtn = document.getElementById('createChatBtn');
const chatNameInput = document.getElementById('chatName');
const editChatBtn = document.body.querySelector('#editChatBtn');

createGroupChatBtn.addEventListener('click', () => {
    createChatBtn.style.display = 'flex';
    editChatBtn.style.display = 'none';
    createChatModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    createChatModal.style.display = 'none';
});


async function getUsers() {
    const currentUserId = await fetchCurrentUser();
    fetch('http://127.0.0.1:8000/users/')
        .then(response => response.json())
        .then(data => {
            const ulElem = document.body.querySelector('#userListModal');

            data.forEach(user => {

                const liElem = document.createElement('li');
                liElem.setAttribute('class', 'user-modal');

                const inputElem = document.createElement('input');
                inputElem.setAttribute('type', 'checkbox');
                inputElem.setAttribute('class', 'user-checkbox');
                inputElem.setAttribute('id', user.id);

                const labelElem = document.createElement('label');
                labelElem.setAttribute('for', user.username);
                labelElem.setAttribute('class', 'user-name');
                labelElem.textContent = user.username;

                if (currentUserId.toString() !== inputElem.getAttribute('id')) {
                    liElem.appendChild(inputElem);
                    liElem.appendChild(labelElem);
                    ulElem.appendChild(liElem);
                }
            })
        });

}

getUsers();

createChatBtn.addEventListener('click', async () => {
    function getSelectedCheckbox() {
        let selectedUsers = []
        const checkboxes = document.body.querySelectorAll('.user-checkbox');
        const editChatBtn = document.getElementById('editChatBtn');

        createChatBtn.style.display = 'block';
        editChatBtn.style.display = 'none';

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const userId = checkbox.getAttribute('id')
                selectedUsers.push(userId);
            }
        })
        createChatModal.style.display = 'none';
        return selectedUsers;
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': await getCsrfToken()
        },
        body: JSON.stringify({
            name: chatNameInput.value,
            is_group: true,
            users: getSelectedCheckbox()
        })
    };
    fetch('http://127.0.0.1:8000/chats/create/', options)
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.error('Error:', error));

    createChatModal.style.display = 'none';
})

// Обработка удаления чатов
document.body.querySelector('#chatList').addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('chat-delete')) {
        const chatId = e.target.parentNode.getAttribute('data-chat-id');
        const options = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': await getCsrfToken()
            },
        };

        fetch(`http://127.0.0.1:8000/chats/${chatId}/delete/`, options)
    }
})

// Обработка редактирования групповых чатов
document.body.addEventListener('click', (e) => {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const userListModal = document.body.querySelector('#userListModal');
    const createChatBtn = document.body.querySelector('#createChatBtn');
    const editChatBtn = document.body.querySelector('#editChatBtn');

    // Проверяем, был ли клик на кнопке редактирования чата
    if (e.target && e.target.classList.contains('chat-edit')) {
        const chatItem = e.target.closest('[data-chat-id]'); // Находим родительский элемент с data-chat-id
        if (!chatItem) return; // Если элемент не найден, выходим

        const chatId = chatItem.getAttribute('data-chat-id'); // Извлекаем chatId

        // Открываем модальное окно
        createChatModal.style.display = 'flex';
        createChatBtn.style.display = 'none';
        editChatBtn.style.display = 'block';

        // Загружаем данные чата
        fetch(`http://127.0.0.1:8000/chats/`)
            .then(response => response.json())
            .then(data => {
                const chatData = data.find(chat => chat.id.toString() === chatId.toString());
                if (chatData) {
                    chatNameInput.value = chatData.name;
                    userListModal.innerHTML = ''; // Очищаем текущий список пользователей

                    // Загружаем пользователей
                    fetch('http://127.0.0.1:8000/users/')
                        .then(response => response.json())
                        .then(async usersData => {
                            const currentUser = await fetchCurrentUser();
                            usersData.forEach(user => {
                                if (user.id !== currentUser) {
                                    const li = document.createElement('li');
                                    li.classList.add('user-modal');
                                    const checkbox = document.createElement('input');
                                    checkbox.type = 'checkbox';
                                    checkbox.id = user.id;
                                    checkbox.classList.add('user-checkbox');
                                    checkbox.checked = chatData.participants.some(chatUser => chatUser.id === user.id);

                                    const label = document.createElement('label');
                                    label.setAttribute('for', checkbox.id);
                                    label.classList.add('user-name');
                                    label.textContent = user.username;

                                    li.appendChild(checkbox);
                                    li.appendChild(label);
                                    userListModal.appendChild(li);
                                }
                            });
                        })
                        .catch(error => console.error('Error:', error));
                }
            })
            .catch(error => console.error('Ошибка загрузки данных чата:', error));

        // Обработчик для редактирования чата
        const editChatHandler = async () => {
            const newChatName = chatNameInput.value.trim();
            const selectedUsers = [];
            const currentUser = await fetchCurrentUser();
            const checkboxes = document.querySelectorAll('.user-checkbox:checked');
            checkboxes.forEach(checkbox => {
                selectedUsers.push(checkbox.id);
            });
            selectedUsers.push(currentUser);
            console.log(`chatID - ${chatId}\n newChatName - ${newChatName}\n participants - ${selectedUsers}`)

            if (newChatName) {
                fetch(`http://127.0.0.1:8000/chats/${chatId}/edit/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': await getCsrfToken(),
                    },
                    body: JSON.stringify({
                        name: newChatName,
                        participants: selectedUsers,
                    }),
                })
                    .then(response => {
                        if (response.ok) {
                            const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
                            const chatNameElem = chatItem.querySelector('.chat-name');
                            chatNameElem.textContent = newChatName;
                            createChatModal.style.display = 'none'; // Закрываем модальное окно
                        } else {
                            alert('Не удалось сохранить изменения');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при обновлении чата:', error);
                        alert('Произошла ошибка при обновлении чата');
                    });
            }
        };

        editChatBtn.replaceWith(editChatBtn.cloneNode(true));
        document.getElementById('editChatBtn').addEventListener('click', editChatHandler);

        if (e.target === closeModalBtn || e.target === createChatModal) {
            createChatModal.style.display = 'none';
        }
    }
});
