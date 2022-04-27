import { DateTime } from 'luxon'

export const date = DateTime.now().setZone("America/New_York");

export const addMinutesToTimestamp = (minute: number) => {
    return date.plus({ minute }).toUnixInteger()
}

export const hasExpire = (time: number) => {
    return date.toUnixInteger() >= time;
}