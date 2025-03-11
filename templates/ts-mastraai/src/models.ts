import { z } from 'zod';

export const InstagramPostSchema = z.object({
    id: z.string(),
    url: z.string(),
    caption: z.string().optional(),
    timestamp: z.string(),
});

export type InstagramPost = z.infer<typeof InstagramPostSchema>;

export const InstagramPostsSchema = z.object({
    root: z.array(InstagramPostSchema),
});

export type InstagramPosts = z.infer<typeof InstagramPostsSchema>;

export const InstagramPosts = {
    fromRaw: (data: unknown[]): InstagramPosts => {
        const validated = InstagramPostsSchema.parse({ root: data });
        return validated;
    },
};
