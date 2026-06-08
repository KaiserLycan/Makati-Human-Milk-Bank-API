import {prisma} from "../db/db.ts";

export const CreateMilkPool = async (req, res) => {
    

    // This controller creates a new milk pool (R41) by taking an array of raw milk CTNs, validating them, and then creating a new pool_milk record while updating the corresponding raw_milk records to link them to the new pool.
    try {
        const {raw_milk_ctns, actual_volume_ml, remarks} = req.body;

        if(!raw_milk_ctns || !Array.isArray(raw_milk_ctns) || raw_milk_ctns.length === 0){
            return res.status(400).json({error: "Please provide an array of raw milk ctns."});
        }

        const raw_milks = await prisma.raw_milk.findMany({
            where: {
                ctn: {
                    in: raw_milk_ctns,
                }
            }
        });

        const earliest_expiration = new Date(Math.min(...raw_milks.map(m => new Date(m.expiration_date))));

// Validation checks
        if(raw_milks.length !== raw_milk_ctns.length){
            return res.status(400).json({error: "One or more raw milk CTNs were not found."});
        }
// Additional validation checks for each raw milk record
        let expected_volume_ml = 0;

        for(const milk of raw_milks){
            if(milk.qat_status !== "pass"){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} has a QAT status of '${milk.qat_status}'. Only 'pass' is allowed.`});
            }
            if(milk.pid !== null){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} is already pooled in pool ID ${milk.pid}.`});
            }
            if(milk.milk_status === "discarded"){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} has a status of 'discarded' and cannot be pooled.`});
            }
            expected_volume_ml += Number(milk.volume_ml || 0);
        }
        
        const final_actual_volume = actual_volume_ml ? Number(actual_volume_ml) : expected_volume_ml;

        const new_pool = await prisma.$transaction(async (tx) => {
            const created_pool = await tx.pool_milk.create({
                data: {
                    expected_volume_ml: parseFloat(expected_volume_ml.toFixed(2)),
                    actual_volume_ml: parseFloat(final_actual_volume.toFixed(2)),
                    
                    // Connect both relationships
                    user_pool_milk_pooled_byTouser: {
                        connect: { user_id: req.user.user_id }
                    },
                    user_pool_milk_modified_byTouser: {
                        connect: { user_id: req.user.user_id }
                    },

                    pooled_date: new Date(),
                    created_at: new Date(),
                    expiration_date: earliest_expiration,
                    qat_status: 'pending',
                    milk_status: 'good',
                    remarks: remarks || null
                }
            });

         await tx.raw_milk.updateMany({
                where: {
                    ctn: {
                        in: raw_milk_ctns,
                    },
                },
                data: {
                    pid: created_pool.pid,
                    modified_at: new Date(),
                    modified_by: req.user.user_id,
                },
            });
            return created_pool;
        });

        return res.status(201).json({
            message: "Milk pooled successfully.",
            data: new_pool
        })
    }
    catch (error) {
        console.log("Error in CreateMilkPool controller.");
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};

export const UpdatePoolQAT = async (req, res) =>{
    try{
        const {pid} = req.params;
        const {qat_status, remarks} = req.body; 

        const existing_pool = await prisma.pool_milk.findUnique({
            where: {pid: Number(pid)    }
        });
        
        if (!existing_pool) {
            return res.status(404).json({error: "Pool not found."});
        }

        if (existing_pool.milk_status === "discarded"){
            return res.status(400).json({error: "This pool has already been discarded and cannot be updated."});
        }

        const new_milk_status = qat_status === "fail" ? "discarded" : existing_pool.milk_status;

        const updated_pool = await prisma.pool_milk.update({
            where: { pid: Number(pid) },
            data: {
                qat_status: qat_status,
                milk_status: new_milk_status,
                remarks: remarks || existing_pool.remarks,
                modified_at: new Date(),
                modified_by: req.user.user_id 
            }
        });

        return res.status(200).json({
            message: "Pool QAT status updated successfully.",
            data: updated_pool
        }); 

    } catch (error) {
        console.log("Error in UpdatePoolQAT controller.");
        console.log(error);
     return res.status(500).send("Internal Server Error");
    }
}