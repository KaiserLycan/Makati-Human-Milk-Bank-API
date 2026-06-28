export const capitalizeName = (name) => {
    if (!name) return "";
    return name
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
