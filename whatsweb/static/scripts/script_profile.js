let profId;

// получаем токен для post запросов
function getCsrfToken() {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfToken ? csrfToken[1] : '';
}

// авторизованный пользователь
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

// получение пользователя по ссылке
async function getUserIdFromUrl(userUrl) {
    try {
        const response = await fetch(userUrl);
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя: ", error);
        return null;
    }
}

// добавляем в поле инпут имя пользователя
async function enterUserName() {
    try {
        const profiles = await fetch('http://127.0.0.1:8000/prof/').then(response => response.json());
        const currentUser = await fetchCurrentUser();

        // Ищем профиль текущего пользователя
        for (const profile of profiles) {
            const userIdFromUrl = await getUserIdFromUrl(profile.user);

            // Сравниваем ID пользователя с текущим ID
            if (userIdFromUrl === currentUser) {
                const inputUserNameElement = document.body.querySelector('#username');
                profId = profile.id;
                inputUserNameElement.value = profile.display_name;
                break;
            }
        }
    } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
    }
}

document.addEventListener('DOMContentLoaded', enterUserName);

// Кнопка изменения имени
const editBtn = document.getElementById('editBtn');
const usernameField = document.getElementById('username');
const saveBtn = document.getElementById('saveBtn');

editBtn.addEventListener('click', function() {
    usernameField.disabled = false;
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
});

// Обработчик смены имени
async function editUserName() {
    const newUserName = usernameField.value;
    const options = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': await getCsrfToken(),
        },
        body: JSON.stringify({
            display_name: newUserName
        })
    }
    if (newUserName.trim()) {
        await fetch(`http://127.0.0.1:8000/prof/${profId}/edit`, options)
    } else {
        alert('Введите имя')
    }

    usernameField.disabled = true;
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
}

saveBtn.addEventListener('click', editUserName);


// Смена аватара
document.querySelector('#changeAvatarBtn').addEventListener('click', function() {
    document.querySelector('#avatarInput').click();
});

document.querySelector('#avatarInput').addEventListener('change', async function () {
    const file = this.files[0];

    if (!file) {
        alert('Выберите картинку');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    console.log(`formData: ${formData}`);
    console.log(`csrf: ${getCsrfToken()}`);

    fetch('http://127.0.0.1:8000/prof/avatar/', {
        method: 'PATCH',
        headers: {
            'X-CSRFToken': await getCsrfToken(),
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log(`data: ${data}`);
            console.log(`avatar_url: ${data.avatar_url}`);

            if (data.avatar_url) {
                document.querySelector('#avatar').src = data.avatar_url;
            } else {
                alert('Ошибка при изменении аватара1');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка при изменении аватара2');
        });
})




