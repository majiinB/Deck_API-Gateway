import { getOpenAiResponse } from "../services/responseService.js";

export const openAiResponseControllers = async (req, res) => {
    const { thread_id, run_id } = req.query;

    const result = await getOpenAiResponse(thread_id, run_id);

    if (result.data) {
        return res.status(result.status).json(result.data);
    } else {
        return res.status(result.status).json({ error: result.error });
    }
}