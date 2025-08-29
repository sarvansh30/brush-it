const Redis = require('ioredis');

class JobQueue {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    
    this.workers = new Map();
    this.isProcessing = false;
  }

  // Add a job to the queue
  async addJob(type, data, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      priority: options.priority || 1
    };

    const queueKey = `queue:${type}`;
    await this.redis.zadd(queueKey, job.priority, JSON.stringify(job));
    
    console.log(`📋 Job added to queue: ${job.type} (${job.id})`);
    return job.id;
  }

  // Register a worker for a job type
  registerWorker(type, workerFunction) {
    this.workers.set(type, workerFunction);
    console.log(`👷 Worker registered for job type: ${type}`);
  }

  // Start processing jobs
  async startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log('🚀 Job queue processing started');

    while (this.isProcessing) {
      try {
        await this.processNextJob();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      } catch (error) {
        console.error('❌ Queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay on error
      }
    }
  }

  async processNextJob() {
    // Get all queue keys
    const queueKeys = await this.redis.keys('queue:*');
    
    for (const queueKey of queueKeys) {
      const jobType = queueKey.replace('queue:', '');
      
      // Get highest priority job
      const jobs = await this.redis.zrange(queueKey, -1, -1);
      
      if (jobs.length === 0) continue;
      
      const jobData = JSON.parse(jobs[0]);
      
      // Check if job should be delayed
      if (jobData.delay > 0 && Date.now() < jobData.createdAt + jobData.delay) {
        continue;
      }

      // Remove job from queue
      await this.redis.zrem(queueKey, jobs[0]);
      
      // Process the job
      await this.executeJob(jobData);
    }
  }

  async executeJob(job) {
    const worker = this.workers.get(job.type);
    
    if (!worker) {
      console.error(`❌ No worker found for job type: ${job.type}`);
      return;
    }

    try {
      console.log(`⚡ Processing job: ${job.type} (${job.id})`);
      await worker(job.data);
      console.log(`✅ Job completed: ${job.type} (${job.id})`);
    } catch (error) {
      console.error(`❌ Job failed: ${job.type} (${job.id})`, error.message);
      
      job.attempts++;
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        job.delay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s...
        const queueKey = `queue:${job.type}`;
        await this.redis.zadd(queueKey, job.priority, JSON.stringify(job));
        console.log(`🔄 Job requeued for retry: ${job.type} (${job.id}), attempt ${job.attempts}`);
      } else {
        // Move to failed queue
        await this.redis.lpush('queue:failed', JSON.stringify({
          ...job,
          failedAt: Date.now(),
          error: error.message
        }));
        console.log(`💀 Job failed permanently: ${job.type} (${job.id})`);
      }
    }
  }

  async stop() {
    this.isProcessing = false;
    await this.redis.quit();
    console.log('🛑 Job queue processing stopped');
  }
}

// Create singleton instance
const jobQueue = new JobQueue();

// Export functions
const addJob = (type, data, options) => jobQueue.addJob(type, data, options);
const registerWorker = (type, worker) => jobQueue.registerWorker(type, worker);
const startProcessing = () => jobQueue.startProcessing();
const stopProcessing = () => jobQueue.stop();

module.exports = {
  addJob,
  registerWorker,
  startProcessing,
  stopProcessing,
  jobQueue
};