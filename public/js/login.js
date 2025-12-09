let loginButton = document.getElementById('login');
let logoutButton = document.getElementById('logout');
let userIconButton = document.getElementById('userIconButton');

let defaultPic = '/images/abstract-user-flat-1.svg';

function clearAuthState() {
    localStorage.removeItem('profileImage');
}

function updateUIForLoggedIn(user) {
    if (userIconButton) {
        userIconButton.src = user.picture || defaultPic;
        userIconButton.classList.remove('invisible');
        userIconButton.classList.add('ring-2', 'ring-green-500');
    }
    if (loginButton) {
        loginButton.classList.add('hidden');
    }
    if (logoutButton) {
        logoutButton.classList.remove('hidden');
    }
}

function updateUIForLoggedOut() {
    if (userIconButton) {
        userIconButton.src = defaultPic;
        userIconButton.classList.remove('invisible');
        userIconButton.classList.remove('ring-2', 'ring-green-500');
    }
    if (loginButton) {
        loginButton.classList.remove('hidden');
    }
    if (logoutButton) {
        logoutButton.classList.add('hidden');
    }
}

function checkAuthStatus() {
    if (userIconButton) {
        userIconButton.classList.remove('invisible');
        userIconButton.src = defaultPic;
    }
    
    return fetch('/api/user', { cache: 'no-store', credentials: 'include' })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.authenticated && data.user) {
                if (data.user.picture) {
                    localStorage.setItem('profileImage', data.user.picture);
                }
                updateUIForLoggedIn(data.user);
                return { authenticated: true, user: data.user };
            } else {
                clearAuthState();
                updateUIForLoggedOut();
                return { authenticated: false, user: null };
            }
        })
        .catch(function(err) {
            console.error('Error checking auth status:', err);
            clearAuthState();
            updateUIForLoggedOut();
            return { authenticated: false, user: null };
        });
}

export function login() {
    if (!loginButton) {
        return;
    }

    loginButton.addEventListener('click', function() {
        let currentUrl = window.location.href;
        window.open(
            window.location.origin + '/auth/google?redirect=' + encodeURIComponent(currentUrl),
            'googleLogin',
            'width=500,height=600'
        );

        function handleMessage(event) {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data && event.data.loggedIn) {
                window.removeEventListener('message', handleMessage);
                window.location.reload();
            } else if (event.data && event.data.loggedIn === false) {
                window.removeEventListener('message', handleMessage);
                clearAuthState();
                updateUIForLoggedOut();
            }
        }

        window.addEventListener('message', handleMessage);
    });
}

export function logout() {
    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener('click', function() {
        fetch('/auth/logout', { credentials: 'include' })
            .then(function() {
                clearAuthState();
                window.location.reload();
            })
            .catch(function(err) {
                console.error('Logout error:', err);
                clearAuthState();
                window.location.reload();
            });
    });
}

checkAuthStatus();
login();
logout();
