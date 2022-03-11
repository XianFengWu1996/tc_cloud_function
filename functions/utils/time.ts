
export const addMinutesToTimestamp = (minute: number) => {
    return Date.now() + (minute * 60 * 1000)
}

export const hasExpire = (time: number) => {
    return Date.now() >= time;
}