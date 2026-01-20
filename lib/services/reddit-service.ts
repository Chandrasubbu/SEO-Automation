export interface RedditMention {
    postId: string;
    postTitle: string;
    postUrl: string;
    subreddit: string;
    author: string;
    created: string;
    upvotes: number;
    numComments: number;
    snippet: string;
    permalink: string;
}

export class RedditService {
    private baseUrl = 'https://www.reddit.com';

    /**
     * Search Reddit for brand mentions
     */
    async searchMentions(brandName: string, limit: number = 25): Promise<RedditMention[]> {
        try {
            const query = encodeURIComponent(`"${brandName}"`);
            const url = `${this.baseUrl}/search.json?q=${query}&sort=new&limit=${limit}&raw_json=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SEO-Automation-Bot/1.0'
                }
            });

            if (!response.ok) {
                console.warn(`Reddit API returned ${response.status}`);
                return [];
            }

            const data = await response.json();
            const posts = data.data?.children || [];

            return posts.map((post: any) => ({
                postId: post.data.id,
                postTitle: post.data.title,
                postUrl: `https://reddit.com${post.data.permalink}`,
                subreddit: post.data.subreddit,
                author: post.data.author,
                created: new Date(post.data.created_utc * 1000).toISOString(),
                upvotes: post.data.ups,
                numComments: post.data.num_comments,
                snippet: this.extractSnippet(post.data.selftext || post.data.title, brandName),
                permalink: post.data.permalink
            }));
        } catch (error) {
            console.error('Reddit search error:', error);
            return [];
        }
    }

    /**
     * Search specific subreddit
     */
    async searchSubreddit(subreddit: string, brandName: string, limit: number = 10): Promise<RedditMention[]> {
        try {
            const query = encodeURIComponent(`"${brandName}"`);
            const url = `${this.baseUrl}/r/${subreddit}/search.json?q=${query}&restrict_sr=1&sort=new&limit=${limit}&raw_json=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SEO-Automation-Bot/1.0'
                }
            });

            if (!response.ok) {
                console.warn(`Reddit API returned ${response.status}`);
                return [];
            }

            const data = await response.json();
            const posts = data.data?.children || [];

            return posts.map((post: any) => ({
                postId: post.data.id,
                postTitle: post.data.title,
                postUrl: `https://reddit.com${post.data.permalink}`,
                subreddit: post.data.subreddit,
                author: post.data.author,
                created: new Date(post.data.created_utc * 1000).toISOString(),
                upvotes: post.data.ups,
                numComments: post.data.num_comments,
                snippet: this.extractSnippet(post.data.selftext || post.data.title, brandName),
                permalink: post.data.permalink
            }));
        } catch (error) {
            console.error('Reddit subreddit search error:', error);
            return [];
        }
    }

    /**
     * Get trending tech/startup subreddits
     */
    getRelevantSubreddits(industry?: string): string[] {
        const techSubreddits = [
            'SaaS',
            'Entrepreneur',
            'startups',
            'technology',
            'webdev',
            'SEO',
            'marketing',
            'digital_marketing',
            'bigseo',
            'techsupport'
        ];

        return techSubreddits;
    }

    /**
     * Extract relevant snippet containing brand mention
     */
    private extractSnippet(text: string, brandName: string, contextLen: number = 100): string {
        const lowerText = text.toLowerCase();
        const lowerBrand = brandName.toLowerCase();
        const index = lowerText.indexOf(lowerBrand);

        if (index === -1) {
            return text.substring(0, contextLen) + '...';
        }

        const start = Math.max(0, index - contextLen / 2);
        const end = Math.min(text.length, index + brandName.length + contextLen / 2);

        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return snippet;
    }
}

export const redditService = new RedditService();
