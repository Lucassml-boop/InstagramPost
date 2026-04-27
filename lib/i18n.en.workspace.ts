export const enWorkspaceDictionary = {
dashboard: {
  eyebrow: "Dashboard",
  title: "Instagram publishing workspace",
  description: (email: string) =>
    `Logged in as ${email}. Connect the Instagram account, generate content with AI, preview it, and publish or schedule it for your Meta review flow.`,
  logout: "Logout",
  connectedSuccess: "Instagram account connected successfully.",
  publishedSuccess: "Post published successfully.",
  connectionStatus: "Connection status",
  scheduledPosts: "Scheduled posts",
  publishedPosts: "Published posts",
  noAccountTitle: "No account connected yet",
  noAccountDescription:
    "Connect an Instagram Professional account to unlock AI post generation and publishing.",
  connectInstagram: "Connect Instagram",
  quickActions: "Quick actions",
  createPost: "Create Post",
  viewScheduledPosts: "View Scheduled Posts",
  connectedAccount: "Connected Instagram Account",
  operationalHealth: "Operational health",
  ready: "Ready",
  attention: "Needs attention",
  lastPublishCron: "Last publish cron",
  never: "Never",
  publicUrlMissing: "Public asset URL missing",
  tokenExpires: "Token expires",
  failedPosts: "Failed posts"
},

connectInstagram: {
  eyebrow: "Instagram OAuth",
  title: "Connect Instagram Account",
  description:
    "Authorize a professional Instagram account with instagram_business_basic and instagram_business_content_publish so the app can fetch profile data, render assets, and publish posts.",
  body:
    "When you click the button below, the app redirects to Instagram OAuth. After approval, the callback exchanges the code for an access token, fetches the profile, stores it securely on the server, and returns you to the dashboard.",
  button: "Connect Instagram Account"
},

createPost: {
  eyebrow: "AI Generator",
  title: "Create Instagram Post",
  description:
    "Generate a caption, hashtags, and a 1080x1080 visual layout with Ollama Cloud. Preview it, edit the copy, optionally replace the image, then publish or schedule it."
},
};
