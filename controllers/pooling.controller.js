import {prisma} from "../db/db.ts";

// so for context CreateMilkPool this is what it will do:
// 1. Recieve a list of ctn integers and the actual_volume_ml from the frontend
// 2. Query the raw_milk table to get all those records and ensure none are missing
// 3. Loop through the fetched milk if any bottle failed QAT, is already pooled, or is already discarded, return an error
// While looping, add up the volume_ml to get the expected_volume.
// 4. The Transaction: Open an ACID-compliant transaction. Create the new pool_milk record, then update all the raw_milk records to stamp them with the new pid. 

export const CreateMilkPool = async (req, res) => {
    try {
        const {raw_milk_ctns, actual_volume_ml, remarks} = req.body;

        // ensure we have an array of ctns and it's not empty
        if(!raw_milk_ctns || !Array.isArray(raw_milk_ctns) || raw_milk_ctns.length === 0){
            return res.status(400).json({error: "Please provide an array of raw milk ctns."});
        }

        // Fetch all requested raw milk records
        const raw_milks = await prisma.raw_milk.findMany({
            where: {
                ctn: {
                    in: raw_milk_ctns,
                }
            }
        });

        // Ensure the database found every single CTN requested
        if(raw_milks.length !== raw_milk_ctns.length){
            return res.status(400).json({error: "One or more raw milk CTNs were not found."});

        }
        let expected_volume_ml = 0;

        // 2. The validation loop (R40 & R41)
        for(const milk of raw_milks){
            // R40: If any of the raw milk failed QAT, return an error
            if(milk.qat_status !== "pass"){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} has a QAT status of '${milk.qat_status}'. Only 'pass' is allowed.`});
            }
            // Reject if it already belongs to a pool
            if(milk.pid !== null){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} is already pooled in pool ID ${milk.pid}.`});
                
            }
            // Reject if it was previously discarded
            if(milk.milk_status === "discarded"){
                return res.status(400).json({error: `Raw milk CTN ${milk.ctn} has a status of 'discarded' and cannot be pooled.`});
            }
            // R41: Add the volume to the expected volume
            expected_volume_ml += Number(milk.volume_ml || 0);
            
        }
        // determine final actual volume  
        const final_actual_volume = actual_volume_ml ? Number(actual_volume_ml) : expected_volume_ml;

        // 3. Execute ACID Transaction 
        const new_pool = await prisma.$transaction(async (tx) => {
            // Create the new pool record
            const created_pool = await tx.pool_milk.create({
                data: {
                    expected_volume_ml: expected_volume_ml,
                    actual_volume_ml: final_actual_volume, // R41: Volume after leakage deduction
                    pooled_by: req.user.user_id, // Assumes ProtectRoute attaches user to req
                    pooled_date: new Date(),
                    created_at: new Date(),
                    qat_status: 'pending', // Post-pooling requires a new QAT
                    milk_status: 'pooled',
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

        // 4. Send Success Response
        return res.status(201).json({
            message: "Milk pooled successfully.",
            data: new_pool
        })
    }
    catch(error) {
        console.log("Error in CreateMilkPool controller.");
        console.log(error);
        return res.status(500).json({error: "Internal Server Error."}
            )
    }
};

export const UpdatePoolQAT = async (req, res) =>{
    try{
        const {pid} = req.params;
        const {qat_status, remarks} = req.body; 

        // fetch existing pool 
        const existing_pool = await prisma.pool_milk.findUnique({
            where: {pid: Number(pid)    }
        });
        
        if (!existing_pool) {
            return res.status(404).json({error: "Pool not found."});
        }

        if (existing_pool.qat_status === "discarded"){
            return res.status(400).json({error: "This pool has already been discarded and cannot be updated."});
        }

        // 2. Determine the new milk status based on the qat_status
        const new_milk_status = qat_status === "fail" ? "discarded" : existing_pool.milk_status;

        // 3. Update the pool record with the new QAT status and milk status
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

    } catch(error){
        console.log("Error in UpdatePoolQAT controller.");
        console.log(error);
        return res.status(500).json({error: "Internal Server Error."});
    }
}
