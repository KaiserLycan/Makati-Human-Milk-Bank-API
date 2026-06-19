import {
    createCollection as createCollectionService,
    deleteCollection as deleteCollectionService,
    getCollections,
    getCollection,
    updateCollection as updateCollectionService,
    updateMilkStatus as updateMilkStatusService,
    updateQATStatus as updateQATStatusService,
} from "../services/rawMilk.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const queryCollections = async (req, res) => {
    const collections = await getCollections(req.query);
    return res.status(200).json(new APIResponse(200, collections, "Query Successful"));
};

export const viewCollection = async (req, res) => {
    const { ctn } = req.params;
    const collection = await getCollection(parseInt(ctn));
    return res
        .status(200)
        .json(new APIResponse(200, collection, "Successfully retrieved collection."));
};

export const logCollection = async (req, res) => {
    const modified_by = req.user.user_id;
    const newCollection = await createCollectionService({
        ...req.body,
        modified_by,
    });
    return res
        .status(201)
        .json(new APIResponse(201, newCollection, "Collection logged successfully"));
};

export const updateCollection = async (req, res) => {
    const { ctn } = req.params;
    const modified_by = req.user.user_id;

    const updatedCollection = await updateCollectionService(parseInt(ctn), {
        ...req.body,
        modified_by,
    });

    return res
        .status(200)
        .json(new APIResponse(200, updatedCollection, "Collection updated successfully"));
};

export const deleteCollection = async (req, res) => {
    const { ctn } = req.params;
    await deleteCollectionService(parseInt(ctn));
    return res.status(200).json(new APIResponse(200, null, "Successfully deleted collection"));
};

export const updateMilkStatus = async (req, res) => {
    const { ctn } = req.params;
    const { milk_status } = req.body;
    const modified_by = req.user.user_id;
    const updatedCollection = await updateMilkStatusService(
        parseInt(ctn),
        milk_status,
        modified_by,
    );
    return res
        .status(200)
        .json(new APIResponse(200, updatedCollection, "Milk status updated successfully"));
};

export const updateQATStatus = async (req, res) => {
    const { ctn } = req.params;
    const { qat_status } = req.body;
    const modified_by = req.user.user_id;
    const updatedCollection = await updateQATStatusService(parseInt(ctn), qat_status, modified_by);
    return res
        .status(200)
        .json(new APIResponse(200, updatedCollection, "QAT status updated successfully"));
};
