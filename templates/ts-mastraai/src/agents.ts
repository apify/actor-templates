import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { instagramScraperTool } from './tools.js';

export const createSocialMediaAgent = (modelName: string): Agent =>
    new Agent({
        name: 'Social Media Agent',
        instructions: `You are an expert social media analyst specializing in Instagram analysis.
        You help users understand social media data and extract meaningful insights from
        profiles and posts.`,
        model: openai(modelName),
        tools: { instagramScraperTool },
    });
