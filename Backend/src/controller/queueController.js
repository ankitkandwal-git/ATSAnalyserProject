import {resumeQueue} from "../queues/resumeQueue.js";

export const testQueueController = async(req,res) =>{
    const job = await resumeQueue.add(
        "resume-analysis",{
            resumeText,
            jobDescription
        },
        {
            attempts: 3,
            backoff:{
                type: "exponential",
                delay:2000
            },
            removeOnComplete: 100,
            removeOnFail: 50
        }
    );
    return res.status(200).json({
        message: "Job added to the queue",
        jobId: job.id
    })
}