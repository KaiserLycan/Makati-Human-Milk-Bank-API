import { parseISO, format, isValid } from "date-fns";

export const parseToPrismaDate = (dateString) => {
    const date = parseISO(dateString);

    if (!isValid(date)) {
        throw new Error(`Invalid date format: ${dateString}`);
    }

    return date;
};

export const formatToAppDate = (dbDate) => {
    const date = typeof dbDate === "string" ? parseISO(dbDate) : dbDate;

    if (!isValid(date)) {
        throw new Error(`Invalid date format: ${dbDate}`);
    }

    return format(date, "yyyy-mm-dd");
};
