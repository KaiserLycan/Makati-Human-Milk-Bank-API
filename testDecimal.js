import pkg from "@prisma/client";
const { Prisma } = pkg;
const dec = new Prisma.Decimal("120");
console.log("Adding:", dec + 120);
try {
    if (dec + 120 > 800) {
        console.log("Greater than 800");
    } else {
        console.log("Less than 800");
    }
} catch (e) {
    console.log("Error:", e);
}
