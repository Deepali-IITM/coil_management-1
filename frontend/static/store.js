const store = new Vuex.Store({
    state: {
        auth_token: null,
        role: null,
        loggedIn: false,
        user_id: null,
    },
    mutations: {
        setUser(state) {
            try {
                // Support both 'user' object and individual keys
                const token = localStorage.getItem("auth-token");
                const role = localStorage.getItem("role");
                const userId = localStorage.getItem("user_id");
                if (token) {
                    state.auth_token = token;
                    state.role = role;
                    state.loggedIn = true;
                    state.user_id = userId;
                }
            } catch {
                console.warn("Could not restore user session");
            }
        },

        logout(state) {
            state.auth_token = null;
            state.role = null;
            state.loggedIn = false;
            state.user_id = null;
        }
    },
    actions: {}
});

store.commit("setUser");

export default store;
