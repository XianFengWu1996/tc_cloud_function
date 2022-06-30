import { DateTime } from 'luxon'

export const luxon_date = DateTime.now().setZone("America/New_York");
export const currentMinute = (luxon_date.hour * 60) + luxon_date.minute

export const format_date = () => {
    const date = DateTime.now().setZone("America/New_York");

    return {
        timestamp: date.toMillis(),
        formatted: date.toFormat('DDD T'),
        date
    }
}

export const convert_minute_to_timestamp = (minute: number) => {
    const { date } = format_date();
    return date.plus({ minute }).toMillis()
}

export const hasExpire = (time: number) => {
    const { date } = format_date();
    return date.toMillis() >= time;
}

export const convert_minute_to_format_time = (total_minute: number) => {
    let hour = Number((total_minute / 60).toFixed(0))
    let minute = total_minute % 60

    let format_hour = hour < 10 ? `0${hour}` : hour.toString();
    let format_minute = minute < 10 ? `0${minute}` : minute.toString();

    return `${format_hour}:${format_minute}${hour < 13 ? 'AM' : 'PM'}`
}