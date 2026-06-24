import { prisma } from "./library/db/db.ts";

async function test() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyRawMilk = await prisma.raw_milk.aggregate({
        _sum: { volume_ml: true },
        where: {
            dtn: 1,
            program: "WI",
            collection_date: { gte: startOfDay },
        },
    });

    const currentTotal = dailyRawMilk._sum.volume_ml || 0;
    console.log("currentTotal:", currentTotal);
    console.log("Type of currentTotal:", typeof currentTotal);

    if (currentTotal !== 0) {
        console.log("Is Decimal:", typeof currentTotal.toNumber === "function");
        const sum = currentTotal + 120;
        console.log("sum:", sum);
        console.log("sum > 800:", sum > 800);
    }
}

test()
    .catch(console.error)
    .finally(() => process.exit(0));
