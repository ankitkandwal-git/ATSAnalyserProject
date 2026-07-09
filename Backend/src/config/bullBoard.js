import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { resumeQueue } from "../queues/resumeQueue.js";


const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");


createBullBoard({
  queues: [new BullMQAdapter(resumeQueue)],
  serverAdapter,
});


export { serverAdapter };
