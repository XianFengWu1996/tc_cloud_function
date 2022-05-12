import { DateTime } from 'luxon'

export const format_date = () => {
    const date = DateTime.now().setZone("America/New_York");

    return {
        timestamp: date.toMillis(),
        formatted: date.toFormat('DDD T'),
        date
    }
}

export const addMinutesTounix_timestamp = (minute: number) => {
    const { date } = format_date();
    return date.plus({ minute }).toUnixInteger()
}

export const hasExpire = (time: number) => {
    const { date } = format_date();
    return date.toUnixInteger() >= time;
}