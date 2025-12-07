export function getUserProfile() {
    return fetch('/api/user', { credentials: 'include', cache: 'no-store' })
        .then(response => response.json())
        .then(data => {
            let state = { authenticated: false, user: null };
            if (data && data.authenticated && data.user) {
                state.authenticated = true;
                state.user = data.user;
            }
            return state;
        })
        .catch(() => {
            return { authenticated: false, user: null };
        });
}

