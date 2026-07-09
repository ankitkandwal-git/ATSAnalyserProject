import {Worker} from 'bullmq';
import bullmqRedisConnection from '../config/bullmq.js';
const worker = new Worker(
    "resume-analysis",
    async(job) =>{
        console.log(`Processing job ${job.id} of type ${job.name}`);
        console.log(`Job data:`, job.data);
    },
    {
        connection: bullmqRedisConnection
    }
);

worker.on("completed",(jobs)=>{
    console.log(`Job ${jobs.id} has been completed`);
});

worker.on("failed",(jobs,err)=>{
    console.error(`Job ${jobs.id} has failed with error:`, err);
}
);
export default worker;