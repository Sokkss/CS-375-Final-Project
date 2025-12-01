let loginButton = document.getElementById('login');
let logoutButton = document.getElementById('logout');
let userIconButton = document.getElementById('userIconButton');
let userDropdown = document.getElementById('userDropdown');

async function updateUserIcon() {
    if (!userIconButton) return;

    const defaultPic = '../images/abstract-user-flat-1.svg';
    const cachedPic = localStorage.getItem('profileImage');

    if (cachedPic) {
        userIconButton.src = cachedPic;
    } else {
        userIconButton.src = defaultPic;
    }

    try {
        const response = await fetch('/api/user', { cache: 'no-store', credentials: 'include' });
        const data = await response.json();

        if (data.authenticated && data.user?.picture) {
            const serverPic = data.user.picture;
            userIconButton.src = serverPic;
            localStorage.setItem('profileImage', serverPic);
        } else {
            userIconButton.src = defaultPic;
            localStorage.removeItem('profileImage');
        }
    } catch (err) {
        console.error('Error checking user:', err);
    }
}

export function login() {
    if (!loginButton || !userIconButton) return;

    loginButton.addEventListener('click', () => {
        const currentUrl = window.location.href;
        const popup = window.open(
            `${window.location.origin}/auth/google?redirect=${encodeURIComponent(currentUrl)}`,
            "googleLogin",
            "width=500,height=600"
        );
 
        function handleMessage(event) {
            if (event.origin !== window.location.origin) return;

            if (event.data.loggedIn && event.data.user?.picture) {
                const icon = event.data.user.picture;
                localStorage.setItem('profileImage', icon); 
                updateUserIcon();
            }

            if (event.data.loggedIn) {
                window.removeEventListener('message', handleMessage);
            }
        }

        window.addEventListener('message', handleMessage);
    });
}

export function logout() {
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
        await fetch('/auth/logout', { credentials: 'include' });

        localStorage.removeItem('profileImage');
        updateUserIcon();

        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.textContent = '';
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'You must be logged in to view the calendar.';
            errorMessage.classList.add('font-semibold', 'text-center', 'mt-4');
            calendar.appendChild(errorMessage);
        }
    });
}

if (userIconButton && userDropdown) {
    userIconButton.addEventListener('click', (event) => {
        userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!userIconButton.contains(event.target) && !userDropdown.contains(event.target)) {
            userDropdown.classList.add('hidden');
        }
    });
}

updateUserIcon();
login();
logout();