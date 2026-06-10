import { prisma } from "../db/db.ts";
import { startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    startOfYear, 
    endOfYear, 
    eachDayOfInterval, 
    eachMonthOfInterval, 
    format, 
    isSameDay, 
    isSameMonth } from "date-fns";








export const GetDashboardMetrics = async (req, res) => {
    try {
        const {range} = req.query;
        const now = new Date();
        let startDate, endDate;





        if (range === "week") {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (range === "month") {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        } else if (range === "year") {
            startDate = startOfYear(now);
            endDate = endOfYear(now);
        } else {
            return res.status(400).json({ error: "Invalid range. Use '?range=week', '?range=month', or '?range=year'." });
        }






        const dateFilter = { gte: startDate, lte: endDate };

        const activeDonors = await prisma.donor.count({
            where:{
                application_status: "approved",
                account_status: "active",
                joined_date: dateFilter
            }
        });








        const activeBeneficiaries = await prisma.beneficiary.count({
            where:{
                application_status: "approved",
                account_status: "active",
                joined_date: dateFilter
            }
        });







        const collectedMilk = await prisma.raw_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                milk_status: "good",
                collection_date: dateFilter
            }
        });







        const processedMilk = await prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                processed_date: dateFilter
            }
        });






        const dispensedMilk = await prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                dispense_status: "dispensed",
                modified_at: dateFilter
            }
        });






        const wasteFilter = { in: ['discarded', 'contaminated', 'expired'] };

        const rawWaste = await prisma.raw_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                milk_status: wasteFilter,
                collection_date: dateFilter
            }
        });






        const poolWaste = await prisma.pool_milk.aggregate({
            _sum: { actual_volume_ml: true },
            where: {
                milk_status: wasteFilter,
                pooled_date: dateFilter
            }
        });







        const pasteurizedWaste = await prisma.pasteurized_milk.aggregate({
            _sum: { volume_ml: true },
            where: {
                milk_status: wasteFilter,
                processed_date: dateFilter
            }
        });







        const totalRawWaste = Number(rawWaste._sum.volume_ml) || 0;
        const totalPoolWaste = Number(poolWaste._sum.actual_volume_ml) || 0;
        const totalPasteurizedWaste = Number(pasteurizedWaste._sum.volume_ml) || 0;
        const totalWaste = totalRawWaste + totalPoolWaste + totalPasteurizedWaste;








        return res.status(200).json({
            timeframe: {
                range: range,
                start: startDate,
                end: endDate
            },
            participants: {
                donors: activeDonors,
                beneficiaries: activeBeneficiaries
            },
            milk_volumes_ml: {
                collected: collectedMilk._sum.volume_ml || 0,
                processed: processedMilk._sum.volume_ml || 0,
                dispensed: dispensedMilk._sum.volume_ml || 0,
            },
            waste_volumes_ml: {
                total_discarded: totalWaste,
                breakdown: {
                    raw_stage: totalRawWaste,
                    pool_stage: totalPoolWaste,
                    pasteurized_stage: totalPasteurizedWaste
                }
            }
        });
    } catch (error) {
        console.log("Error in GetDashboardMetrics Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });    



    }
}

export const GetDashboardTrends = async (req, res) => {
    try {
        const { range } = req.query; 
        const now = new Date();
        let startDate, endDate, intervals, formatString, compareFunc;

        if (range === 'week') {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            intervals = eachDayOfInterval({ start: startDate, end: endDate });
            formatString = 'EEE'; 
            compareFunc = isSameDay;
        } else if (range === 'month') {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            intervals = eachDayOfInterval({ start: startDate, end: endDate });
            formatString = 'dd MMM'; // e.g., '01 Jun', '02 Jun'
            compareFunc = isSameDay;
        } else if (range === 'year') {
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            intervals = eachMonthOfInterval({ start: startDate, end: endDate });
            formatString = 'MMM'; // e.g., 'Jan', 'Feb'
            compareFunc = isSameMonth;
        } else {
            return res.status(400).json({ error: "Invalid range." });
        }

        const dateFilter = { gte: startDate, lte: endDate };

        const collectedData = await prisma.raw_milk.findMany({
            where: { milk_status: 'good', collection_date: dateFilter },
            select: { volume_ml: true, collection_date: true }
        });

        const processedData = await prisma.pasteurized_milk.findMany({
            where: { processed_date: dateFilter },
            select: { volume_ml: true, processed_date: true }
        });

        const dispensedData = await prisma.pasteurized_milk.findMany({
            where: { dispense_status: 'dispensed', modified_at: dateFilter },
            select: { volume_ml: true, modified_at: true }
        });

        const trendData = intervals.map(intervalDate => {
            const collected = collectedData
                .filter(d => compareFunc(new Date(d.collection_date), intervalDate))
                .reduce((sum, d) => sum + Number(d.volume_ml), 0);
            
            const processed = processedData
                .filter(d => compareFunc(new Date(d.processed_date), intervalDate))
                .reduce((sum, d) => sum + Number(d.volume_ml), 0);

            const dispensed = dispensedData
                .filter(d => compareFunc(new Date(d.modified_at), intervalDate))
                .reduce((sum, d) => sum + Number(d.volume_ml), 0);

            return {
                label: format(intervalDate, formatString),
                collected,
                processed,
                dispensed
            };
        });

        return res.status(200).json({ range, data: trendData });

    } catch (error) {
        console.log("Error in GetDashboardTrends Controller:");
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}