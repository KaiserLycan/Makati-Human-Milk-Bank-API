import { prisma } from "./library/db/db.ts";
import { subDays, startOfDay } from "date-fns";

async function main() {
    console.log("Cleaning existing transient transaction metrics data...");
    
    // We keep existing users to prevent breaking credentials, but clean other tables if needed
    // or we can just append/populate new data safely.
    // To ensure clean dashboard visuals, let's delete raw milk, pasteurized milk, batches, pools, requests, donors, beneficiaries.
    // We run deletes in order of dependency.
    try {
        await prisma.request_bottles.deleteMany({});
        await prisma.request.deleteMany({});
        await prisma.pasteurized_milk.deleteMany({});
        await prisma.batch_milk.deleteMany({});
        await prisma.pool_milk.deleteMany({});
        await prisma.raw_milk.deleteMany({});
        await prisma.donor.deleteMany({});
        await prisma.beneficiary.deleteMany({});
        console.log("Cleanup complete!");
    } catch (e) {
        console.warn("Cleanup encountered errors (this is normal if tables were empty):", e);
    }

    // Ensure we have a default manager/staff user to link transactions to
    let staffUser = await prisma.user.findFirst({
        where: { role: "staff", status: "active" }
    });
    if (!staffUser) {
        staffUser = await prisma.user.create({
            data: {
                name: "Primary Staff",
                email: "staff@mhmb.gov",
                phone: "+639170000001",
                password: "$2a$10$7zBQL2vPjG7Jp6g3/K8Nee6Gf67l2v7e5lqN/rGjV9.2mJ5/H6Pzi", // password123 hashed
                role: "staff",
                status: "active"
            }
        });
    }

    const today = startOfDay(new Date());

    console.log("Seeding donors...");
    const donors = [];
    const donorNames = [
        "Maria Santos", "Ana Gomez", "Elena Diaz", "Julia Reyes", "Clara Cruz",
        "Sofia Luna", "Rosa Lim", "Isabela Torres", "Carmen Villa", "Patricia Aquino"
    ];

    for (let i = 0; i < donorNames.length; i++) {
        // distribute joined_date over the past 30 days
        const joinedDate = subDays(today, 30 - i * 3);
        const donor = await prisma.donor.create({
            data: {
                name: donorNames[i],
                email: `donor${i + 1}@example.com`,
                phone: `+6391500000${10 + i}`,
                birth_date: new Date("1995-04-12"),
                joined_date: joinedDate,
                application_status: "approved",
                account_status: "active",
                profile: {
                    personal_information: { home_address: "Makati City" }
                }
            }
        });
        donors.push(donor);
    }

    console.log("Seeding beneficiaries...");
    const beneficiaries = [];
    const beneficiaryNames = [
        "Baby Liam Santos", "Baby Sophia Gomez", "Baby Noah Diaz", "Baby Olivia Reyes",
        "Baby Elijah Cruz", "Baby Emma Luna", "Baby James Lim", "Baby Ava Torres",
        "Baby Lucas Villa", "Baby Mia Aquino"
    ];

    for (let i = 0; i < beneficiaryNames.length; i++) {
        const joinedDate = subDays(today, 28 - i * 2.5);
        const beneficiary = await prisma.beneficiary.create({
            data: {
                name: beneficiaryNames[i],
                caregiver: `Caregiver ${i + 1}`,
                caregiver_email: `caregiver${i + 1}@example.com`,
                caregiver_phone: `+6391600000${10 + i}`,
                birth_date: new Date("2026-01-15"),
                weight_kg: 3.2 + i * 0.1,
                feeding_requirement_ml: 120 + i * 10,
                joined_date: joinedDate,
                application_status: "approved",
                account_status: "active",
                profile: {
                    medical_history: { details: "None" }
                }
            }
        });
        beneficiaries.push(beneficiary);
    }

    console.log("Seeding raw milk collections...");
    const programs = ["WI", "MA", "MW", "ST"];
    const rawMilks = [];

    // Seed 40 raw milk entries spread over past 30 days
    for (let i = 0; i < 40; i++) {
        const donor = donors[i % donors.length];
        const collectionDate = subDays(today, 30 - (i * 0.7));
        const program = programs[i % programs.length] as "WI" | "MA" | "MW" | "ST";
        
        // Some good milk, some discarded/contaminated/expired for waste aggregation tests
        let milkStatus: "good" | "contaminated" | "expired" | "discarded" = "good";
        if (i % 8 === 0) milkStatus = "contaminated";
        else if (i % 12 === 0) milkStatus = "expired";

        const volume = 200 + (i * 15) % 400; // between 200 and 600 ml

        const rawMilk = await prisma.raw_milk.create({
            data: {
                dtn: donor.dtn,
                program: program,
                volume_ml: volume,
                collection_date: collectionDate,
                expiration_date: subDays(collectionDate, -90), // 3 months expiration
                qat_status: milkStatus === "good" ? "pass" : "fail",
                milk_status: milkStatus,
                collected_by: staffUser.user_id,
                remarks: "Standard collection"
            }
        });
        rawMilks.push(rawMilk);
    }

    console.log("Seeding pooled milk and pasteurized batches...");
    // Let's create pools from the good raw milk collections
    const goodRawMilks = rawMilks.filter(m => m.milk_status === "good");

    // Create 8 pools of milk
    for (let i = 0; i < 8; i++) {
        const pooledDate = subDays(today, 20 - i * 2.5);
        const poolRawMilks = goodRawMilks.slice(i * 3, (i + 1) * 3);
        const totalVolume = poolRawMilks.reduce((sum, m) => sum + Number(m.volume_ml), 0);

        if (totalVolume === 0) continue;

        // Create Pool record
        const pool = await prisma.pool_milk.create({
            data: {
                pooled_by: staffUser.user_id,
                pooled_date: pooledDate,
                expiration_date: subDays(pooledDate, -180), // 6 months expiration
                expected_volume_ml: totalVolume,
                actual_volume_ml: totalVolume,
                remaining_volume_ml: totalVolume,
                milk_status: "good",
                remarks: `Pool batch ${i + 1}`
            }
        });

        // Update raw_milk entries to link to this pool
        for (const rm of poolRawMilks) {
            await prisma.raw_milk.update({
                where: { ctn: rm.ctn },
                data: { pid: pool.pid }
            });
        }

        // Process pool into a pasteurization batch
        const batch = await prisma.batch_milk.create({
            data: {
                processed_date: pooledDate,
                processed_by: staffUser.user_id,
                source: pool.pid,
                bottle_count: 4
            }
        });

        // Create pasteurized bottles
        for (let seq = 1; seq <= 4; seq++) {
            const bottleVol = totalVolume / 4;
            
            // Dispense status: some available, some dispensed, some discarded/expired
            let dispenseStatus: "available" | "dispensed" | "reserved" = "available";
            let milkStatus: "good" | "contaminated" | "expired" | "discarded" = "good";

            if (seq === 1 && i % 2 === 0) {
                dispenseStatus = "dispensed";
            } else if (seq === 2 && i % 3 === 0) {
                milkStatus = "discarded"; // waste
            }

            await prisma.pasteurized_milk.create({
                data: {
                    batch_number: batch.batch_id,
                    bottle_sequence_number: seq,
                    volume_ml: bottleVol,
                    bottle: "ameda",
                    expiration_date: subDays(pooledDate, -180),
                    mbt_status: milkStatus === "good" ? "pass" : "fail",
                    dispense_status: dispenseStatus,
                    milk_status: milkStatus,
                    remarks: `Bottle ${seq} for batch ${batch.batch_id}`,
                    // Link modified_at for dispensing stats
                    modified_at: dispenseStatus === "dispensed" ? subDays(today, 15 - i * 2) : pooledDate
                }
            });
        }

        // Decrement remaining volume of pool to 0 since it is fully bottled
        await prisma.pool_milk.update({
            where: { pid: pool.pid },
            data: { remaining_volume_ml: 0 }
        });
    }

    console.log("Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
