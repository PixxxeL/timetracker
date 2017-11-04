export default {

    /**
     * 
     */
    get(key) {
        try {
            return JSON.parse(window.localStorage.getItem(this._getStorageKey(key)));
        } catch (err) {}
    },

    /**
     * 
     */
    set(key, data) {
        try {
            window.localStorage.setItem(this._getStorageKey(key), JSON.stringify(data));
        } catch (err) {}
    },

    /**
     * 
     */
    _getStorageKey(key) {
        return `timetracker-${key}`;
    }

};
