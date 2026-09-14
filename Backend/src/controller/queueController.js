import {resumeQueue, isResumeQueueEnabled} from "../queues/resumeQueue.js";

export const testQueueController = async(req,res) =>{
    try {
        if (!isResumeQueueEnabled || !resumeQueue) {
            return res.status(503).json({
                success: false,
                message: "Queue is currently unavailable",
            });
        }

        const { resumeText = "Test resume text", jobDescription = "Test job description" } = req.body || {};

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
            success: true,
            message: "Job added to the queue",
            jobId: job.id
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add job to queue",
            error: error.message,
        });
    }
}