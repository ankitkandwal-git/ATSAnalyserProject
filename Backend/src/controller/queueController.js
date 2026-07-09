import {resumeQueue} from "../queues/resumeQueue.js";

export const testQueueController = async(req,res) =>{
    const job = await resumeQueue.add(
        "resume-analysis",{
            name:"Ankit",
            age : 21
        }
    );
    return res.status(200).json({
        message: "Job added to the queue",
        jobId: job.id
    })
}