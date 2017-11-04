function formatMilliseconds(ms) {
    ms = (ms * .001) | 0;
    let seconds = ms % 60;
    let minutes = ((ms / 60) % 60) | 0;
    let hours = (ms / 60 / 60) | 0;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    }
    if (minutes < 10) {
        minutes = `0${minutes}`;
    }
    return `${hours}:${minutes}:${seconds}`;
}

export {
    formatMilliseconds
};
