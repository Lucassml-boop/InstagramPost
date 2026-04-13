export const LOCALE_COOKIE_NAME = "site_locale";
export const locales = ["en", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

type Dictionary = {
  common: {
    appName: string;
    reviewDemo: string;
    preview: string;
    caption: string;
    status: string;
    connected: string;
    notConnected: string;
    pending: string;
    save: string;
    serverConnectionError: string;
  };
  language: {
    label: string;
    en: string;
    ptBR: string;
  };
  sidebar: {
    dashboard: string;
    connectInstagram: string;
    createPost: string;
    scheduledPosts: string;
    contentAutomation: string;
    automationDiagnostics: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    password: string;
    forgotPassword: string;
    createAccount: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    continueError: string;
  };
  register: {
    title: string;
    description: string;
    email: string;
    password: string;
    confirmPassword: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    submitting: string;
    loginLink: string;
    passwordMismatch: string;
    continueError: string;
  };
  forgotPassword: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    loginLink: string;
    continueError: string;
    devLinkLabel: string;
  };
  resetPassword: {
    title: string;
    description: string;
    password: string;
    confirmPassword: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    invalidToken: string;
    loginLink: string;
    passwordMismatch: string;
    continueError: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    description: (email: string) => string;
    logout: string;
    connectedSuccess: string;
    publishedSuccess: string;
    connectionStatus: string;
    scheduledPosts: string;
    publishedPosts: string;
    noAccountTitle: string;
    noAccountDescription: string;
    connectInstagram: string;
    quickActions: string;
    createPost: string;
    viewScheduledPosts: string;
    connectedAccount: string;
  };
  connectInstagram: {
    eyebrow: string;
    title: string;
    description: string;
    body: string;
    button: string;
  };
  createPost: {
    eyebrow: string;
    title: string;
    description: string;
  };
  generator: {
    contentTab: string;
    settingsTab: string;
    topic: string;
    topicPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    postType: string;
    postTypeFeed: string;
    postTypeStory: string;
    postTypeCarousel: string;
    carouselSlides: string;
    carouselSlidesDescription: string;
    carouselSlidesCount: string;
    carouselSlideContextLabel: string;
    carouselSlideContextPlaceholder: string;
    carouselDefaultStructure: string;
    carouselDefaultStructureDescription: string;
    restoreCarouselStructure: string;
    storyMode: string;
    storyModeImageOnly: string;
    storyModeWithCaption: string;
    storyModeDescription: string;
    tone: string;
    toneProfessional: string;
    toneCasual: string;
    tonePromotional: string;
    outputLanguage: string;
    outputLanguageDescription: string;
    outputLanguageEnglish: string;
    outputLanguagePtBR: string;
    briefingMode: string;
    briefingModeDescription: string;
    briefingModeGuided: string;
    briefingModeGuidedDescription: string;
    briefingModePrompt: string;
    briefingModePromptDescription: string;
    guidedBriefingTitle: string;
    guidedBriefingDescription: string;
    guidedBriefingPreview: string;
    guidedBriefingPreviewDescription: string;
    restoreGuidedBriefing: string;
    briefingBusinessSummary: string;
    briefingTargetAudience: string;
    briefingMainObjective: string;
    briefingProductsOrServices: string;
    briefingBrandVoice: string;
    briefingDifferentiators: string;
    briefingPainPoints: string;
    briefingContentPillars: string;
    briefingCtaPreference: string;
    briefingRestrictions: string;
    customInstructions: string;
    customInstructionsDescription: string;
    customInstructionsPlaceholder: string;
    restoreDefaultInstructions: string;
    settingsSaved: string;
    settingsSaveError: string;
    removeMedia: string;
    carouselCount: string;
    brandColors: string;
    brandColorsHint: string;
    keywords: string;
    keywordsPlaceholder: string;
    generate: string;
    generating: string;
    generationProgress: string;
    generationEstimate: (formattedTimeout: string, carouselSlideCount: number | null) => string;
    generationElapsed: string;
    generationSlow: string;
    cancelGeneration: string;
    generationCanceled: string;
    clearGeneratedPost: string;
    editCaption: string;
    publishNow: string;
    publishing: string;
    saveSchedule: string;
    scheduleTimeRequired: string;
    generateError: string;
    publishError: string;
    scheduleError: string;
    autoGenerateField: string;
    autoGeneratingField: string;
    autoGenerateAllFields: string;
    autoGenerateHint: string;
  };
  upload: {
    title: string;
    description: string;
    carouselTitle: string;
    carouselDescription: string;
    markAsAiGenerated: string;
    markAsAiGeneratedDescription: string;
    uploading: string;
    error: string;
  };
  preview: {
    imageAlt: string;
    empty: string;
    noCaption: string;
    previous: string;
    next: string;
    downloadPost: string;
    downloadCurrentSlide: string;
  };
  scheduler: {
    label: string;
  };
  instagramCard: {
    title: string;
    username: string;
    instagramId: string;
    connectionStatus: string;
  };
  scheduledPage: {
    eyebrow: string;
    title: string;
    description: string;
    savedSuccess: string;
    updatedSuccess: string;
    updateError: string;
    scheduleRequired: string;
    preview: string;
    caption: string;
    scheduledTime: string;
    publishedAt: string;
    status: string;
    fileStatus: string;
    scheduledStatus: string;
    publishedStatus: string;
    failedStatus: string;
    publicationStatePublished: string;
    publicationStateArchived: string;
    publicationStateDeleted: string;
    fileAvailable: string;
    fileDeleted: string;
    fileRemote: string;
    editSchedule: string;
    reschedule: string;
    saving: string;
    scheduledCount: string;
    publishedCount: string;
    processedCount: string;
    previewUnavailable: string;
    noPosts: string;
    previewAlt: string;
    select: string;
    selectAll: string;
    deleteSelected: string;
    deleting: string;
    clearSelection: string;
    deleteSuccess: string;
    deleteError: string;
    selectAtLeastOne: string;
    instagramFeedTitle: string;
    instagramFeedDescription: string;
    instagramFeedEmpty: string;
    instagramFeedError: string;
    openOnInstagram: string;
  };
  contentAutomation: {
    eyebrow: string;
    title: string;
    description: string;
    brandName: string;
    editableBrief: string;
    automationLoopEnabled: string;
    automationLoopDescription: string;
    topicsHistoryCleanupFrequency: string;
    topicsHistoryCleanupDescription: string;
    cleanupFrequencyDisabled: string;
    cleanupFrequencyDaily: string;
    cleanupFrequencyWeekly: string;
    cleanupFrequencyMonthly: string;
    services: string;
    contentRules: string;
    researchQueries: string;
    carouselDefaultStructure: string;
    listHint: string;
    howItWorksTitle: string;
    howItWorksDescription: string;
    agendaTab: string;
    settingsTab: string;
    scheduleLabel: string;
    scheduleDescription: string;
    weeklyAgendaTitle: string;
    weeklyAgendaDescription: string;
    enableAllDays: string;
    disableAllDays: string;
    dayEnabled: string;
    showMoreDay: string;
    showLessDay: string;
    dayPostsSummary: string;
    dayDisabledSummary: string;
    noDayGoal: string;
    dayGoal: string;
    dayTypes: string;
    dayFormats: string;
    postsPerDay: string;
    postTimes: string;
    postTimesHint: string;
    presetLibraryTitle: string;
    presetLibraryDescription: string;
    goalPresets: string;
    contentTypePresets: string;
    formatPresets: string;
    savedPresetsHint: string;
    autoGenerateField: string;
    autoGenerateHint: string;
    autoGeneratingField: string;
    autoGenerateSectionHint: string;
    autoGenerateAll: string;
    chooseSavedPreset: string;
    noSavedPresets: string;
    singlePostLabel: string;
    multiplePostsLabel: string;
    postLabel: string;
    saveButton: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    generateButton: string;
    generating: string;
    generateHint: string;
    generateSuccess: string;
    generateError: string;
    currentTopics: string;
    topicsHistoryTitle: string;
    topicsHistoryDescription: string;
    clearTopicsHistory: string;
    clearTopicsHistorySuccess: string;
    clearTopicsHistoryError: string;
    noTopicsHistory: string;
    generatedAgendaTitle: string;
    generatedAgendaDescription: string;
    noAgenda: string;
    structure: string;
    visualIdea: string;
    strategySection: string;
    strategyDescription: string;
    automationSection: string;
    automationDescription: string;
    sourcesSection: string;
    sourcesDescription: string;
    memorySection: string;
    memoryDescription: string;
    agendaRulesSection: string;
    agendaRulesDescription: string;
    generatedSection: string;
    generatedDescription: string;
  };
  automationDiagnostics: {
    eyebrow: string;
    title: string;
    description: string;
    helpTitle: string;
    helpDescription: string;
    generateWeeklyTitle: string;
    generateWeeklyDescription: string;
    clearTopicsTitle: string;
    clearTopicsDescription: string;
    publishScheduledTitle: string;
    publishScheduledDescription: string;
    publishWeeklyPreviewTitle: string;
    publishWeeklyPreviewDescription: string;
    publishWeeklyPreviewDay: string;
    publishWeeklyPreviewAllDays: string;
    refreshTokensTitle: string;
    refreshTokensDescription: string;
    runAction: string;
    running: string;
    lastStatus: string;
    notRunYet: string;
    requestFailed: string;
    summaryLabel: string;
    weeklySkipped: string;
    cleanupSkipped: string;
    itemsGenerated: string;
    itemsCleared: string;
    itemsProcessed: string;
    itemsPublished: string;
    itemsFailed: string;
    tokensRefreshed: string;
    awaitingRun: string;
    sectionRealtime: string;
    sectionRealtimeDescription: string;
    sectionSafety: string;
    sectionSafetyDescription: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      appName: "AI Publisher",
      reviewDemo: "Instagram Review Demo",
      preview: "Preview",
      caption: "Caption",
      status: "Status",
      connected: "Connected",
      notConnected: "Not connected",
      pending: "Pending",
      save: "Save",
      serverConnectionError:
        "Unable to reach the app server. Check whether npm run dev is still running and try again."
    },
    language: {
      label: "Language",
      en: "English",
      ptBR: "Portuguese (Brazil)"
    },
    sidebar: {
      dashboard: "Dashboard",
      connectInstagram: "Connect Instagram",
      createPost: "Create Post",
      scheduledPosts: "Scheduled Posts",
      contentAutomation: "Content Automation",
      automationDiagnostics: "Automation Diagnostics"
    },
    login: {
      title: "Login",
      description:
        "Sign in with your existing account to manage Instagram connections, content generation, and publishing flows.",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot your password?",
      createAccount: "Create account",
      emailPlaceholder: "reviewer@example.com",
      passwordPlaceholder: "minimum 8 characters",
      submit: "Login",
      submitting: "Signing in...",
      continueError: "Unable to continue."
    },
    register: {
      title: "Create Account",
      description:
        "Create your account with a secure password so each user has their own protected workspace.",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      emailPlaceholder: "reviewer@example.com",
      passwordPlaceholder: "minimum 8 characters",
      confirmPasswordPlaceholder: "Repeat your password",
      submit: "Create account",
      submitting: "Creating account...",
      loginLink: "Already have an account? Sign in",
      passwordMismatch: "Passwords do not match.",
      continueError: "Unable to create your account."
    },
    forgotPassword: {
      title: "Reset Password",
      description:
        "Enter your email and we will generate a secure reset link if the account exists.",
      email: "Email",
      emailPlaceholder: "reviewer@example.com",
      submit: "Send reset link",
      submitting: "Sending link...",
      success:
        "If this email exists, a password reset link has been generated. In development, the link may appear below.",
      loginLink: "Back to sign in",
      continueError: "Unable to request password reset.",
      devLinkLabel: "Development reset link"
    },
    resetPassword: {
      title: "Choose New Password",
      description:
        "Create a new password to restore access to your account. Existing sessions will be signed out.",
      password: "New password",
      confirmPassword: "Confirm new password",
      passwordPlaceholder: "minimum 8 characters",
      confirmPasswordPlaceholder: "Repeat your new password",
      submit: "Save new password",
      submitting: "Saving password...",
      success: "Password updated successfully. Redirecting to the dashboard...",
      invalidToken: "This password reset link is missing or invalid.",
      loginLink: "Back to sign in",
      passwordMismatch: "Passwords do not match.",
      continueError: "Unable to reset password."
    },
    dashboard: {
      eyebrow: "Dashboard",
      title: "Instagram publishing workspace",
      description: (email) =>
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
      connectedAccount: "Connected Instagram Account"
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
    generator: {
      contentTab: "Content",
      settingsTab: "Settings",
      topic: "Product or topic",
      topicPlaceholder: "Spring skincare launch",
      message: "Promotion or message",
      messagePlaceholder:
        "Promote the limited-time launch offer and highlight natural ingredients.",
      postType: "Post type",
      postTypeFeed: "Feed",
      postTypeStory: "Story",
      postTypeCarousel: "Carousel",
      carouselSlides: "Carousel planning",
      carouselSlidesDescription: "Choose how many slides to generate and optionally describe the purpose of each one. If left blank, AI will infer the narrative.",
      carouselSlidesCount: "Number of slides",
      carouselSlideContextLabel: "Slide context",
      carouselSlideContextPlaceholder: "Optional. Example: social proof, feature highlight, pricing, CTA.",
      carouselDefaultStructure: "Default carousel structure",
      carouselDefaultStructureDescription: "1 Hook cover, 2 problem/context, middle slides for value, penultimate slide for insight, final slide for CTA. You can edit any of these contexts.",
      restoreCarouselStructure: "Restore carousel structure",
      storyMode: "Story format",
      storyModeImageOnly: "Image only",
      storyModeWithCaption: "Image + caption",
      storyModeDescription: "Choose whether this story should be published only as an image or keep a caption in your workflow.",
      tone: "Tone",
      toneProfessional: "Professional",
      toneCasual: "Casual",
      tonePromotional: "Promotional",
      outputLanguage: "Output language",
      outputLanguageDescription: "Choose the language used in the caption and in the text rendered inside the generated post image.",
      outputLanguageEnglish: "English",
      outputLanguagePtBR: "Portuguese (Brazil)",
      briefingMode: "Briefing setup",
      briefingModeDescription: "Choose whether you want to build the briefing from key business points or write the complete prompt manually.",
      briefingModeGuided: "Guided briefing",
      briefingModeGuidedDescription: "Fill in the most important strategic points and let the app assemble the final briefing.",
      briefingModePrompt: "Full prompt",
      briefingModePromptDescription: "Write the full instruction manually when you want maximum control over the briefing.",
      guidedBriefingTitle: "Guided briefing form",
      guidedBriefingDescription: "Use these 10 points to give the AI a stronger strategic context before it writes content or visuals.",
      guidedBriefingPreview: "Generated briefing preview",
      guidedBriefingPreviewDescription: "This is the final briefing that will be sent to the AI while guided mode is active.",
      restoreGuidedBriefing: "Clear guided briefing",
      briefingBusinessSummary: "Business summary",
      briefingTargetAudience: "Target audience",
      briefingMainObjective: "Main objective",
      briefingProductsOrServices: "Products or services",
      briefingBrandVoice: "Brand voice",
      briefingDifferentiators: "Differentiators",
      briefingPainPoints: "Pain points to address",
      briefingContentPillars: "Content pillars",
      briefingCtaPreference: "Preferred CTA",
      briefingRestrictions: "Restrictions and rules",
      customInstructions: "Prompt formula",
      customInstructionsDescription: "Customize the base instruction sent to the AI. You can keep the default formula or rewrite it to match your brand voice.",
      customInstructionsPlaceholder: "You are an expert Instagram content strategist and visual designer.",
      restoreDefaultInstructions: "Restore default formula",
      settingsSaved: "Settings saved successfully.",
      settingsSaveError: "Unable to save settings.",
      removeMedia: "Remove",
      carouselCount: "Carousel items",
      brandColors: "Brand colors",
      brandColorsHint:
        "This field is preserved outside the automatic fill. Save palettes here to keep your brand identity and quickly reuse colors after changes.",
      keywords: "Optional keywords",
      keywordsPlaceholder: "clean beauty, launch, limited offer",
      generate: "Generate Post",
      generating: "Generating...",
      generationProgress: "Generating your post",
      generationEstimate: (formattedTimeout, carouselSlideCount) =>
        carouselSlideCount
          ? `Estimated limit: about ${formattedTimeout} total for this carousel, with 4 extra minutes added per slide.`
          : `Estimated limit: about ${formattedTimeout} total while AI writes and renders the image.`,
      generationElapsed: "Elapsed",
      generationSlow: "Still working. If it gets close to the limit, we will surface a timeout instead of silently hanging.",
      cancelGeneration: "Cancel generation",
      generationCanceled: "Generation canceled.",
      clearGeneratedPost: "Clear current post",
      editCaption: "Edit caption",
      publishNow: "Publish Now",
      publishing: "Publishing...",
      saveSchedule: "Save Schedule",
      scheduleTimeRequired: "Choose a schedule time before saving.",
      generateError: "Unable to generate post.",
      publishError: "Unable to publish.",
      scheduleError: "Unable to schedule.",
      autoGenerateField: "Automatic",
      autoGeneratingField: "Generating...",
      autoGenerateAllFields: "Automatic all",
      autoGenerateHint:
        "Uses the saved strategy and your current inputs as a base so the result stays coherent."
    },
    upload: {
      title: "Upload custom image",
      description: "Uploading an image overrides the AI-generated preview for publishing.",
      carouselTitle: "Upload carousel images",
      carouselDescription:
        "Add between 2 and 10 images. The generated image can be the first slide, and the extra uploads will complete the carousel.",
      markAsAiGenerated: "Mark uploaded images as AI-generated",
      markAsAiGeneratedDescription:
        "Use this if the uploaded images were also created with AI and should carry the same metadata marker.",
      uploading: "Uploading...",
      error: "Upload failed."
    },
    preview: {
      imageAlt: "Generated post preview",
      empty: "Generate a post to preview it here",
      noCaption: "No caption yet.",
      previous: "Previous",
      next: "Next",
      downloadPost: "Download post",
      downloadCurrentSlide: "Download current slide"
    },
    scheduler: {
      label: "Schedule time"
    },
    instagramCard: {
      title: "Connected Instagram Account",
      username: "Username",
      instagramId: "Instagram ID",
      connectionStatus: "Connection Status"
    },
    scheduledPage: {
      eyebrow: "Queue",
      title: "Scheduled Posts",
      description:
        "Track content waiting to be published as well as already-posted items for your review walkthrough.",
      savedSuccess: "Scheduled post saved successfully.",
      updatedSuccess: "Scheduled time updated successfully.",
      updateError: "Unable to update the scheduled time.",
      scheduleRequired: "Choose a new date and time before saving.",
      preview: "Preview",
      caption: "Caption",
      scheduledTime: "Scheduled time",
      publishedAt: "Published at",
      status: "Status",
      fileStatus: "File",
      scheduledStatus: "Scheduled",
      publishedStatus: "Posted",
      failedStatus: "Failed",
      publicationStatePublished: "Still published",
      publicationStateArchived: "Archived",
      publicationStateDeleted: "Deleted",
      fileAvailable: "Available",
      fileDeleted: "Deleted",
      fileRemote: "Stored remotely",
      editSchedule: "Update date",
      reschedule: "Reschedule",
      saving: "Saving...",
      scheduledCount: "Scheduled",
      publishedCount: "Posted",
      processedCount: "Processed",
      previewUnavailable: "No preview",
      noPosts: "No scheduled or published posts yet.",
      previewAlt: "Post preview",
      select: "Select",
      selectAll: "Select all listed posts",
      deleteSelected: "Delete selected",
      deleting: "Deleting...",
      clearSelection: "Clear",
      deleteSuccess: "Selected posts deleted successfully.",
      deleteError: "Unable to delete the selected posts.",
      selectAtLeastOne: "Select at least one post.",
      instagramFeedTitle: "Instagram feed",
      instagramFeedDescription: "These are the latest items currently visible in your connected Instagram feed.",
      instagramFeedEmpty: "No feed items were returned by Instagram yet.",
      instagramFeedError: "Unable to load the Instagram feed",
      openOnInstagram: "Open on Instagram"
    },
    contentAutomation: {
      eyebrow: "Automation",
      title: "Weekly content automation",
      description:
        "Adjust the brand briefing, weekly editorial logic, and topic research used by the AI agent that plans your Instagram content every Sunday.",
      brandName: "Brand name",
      editableBrief: "Editable briefing",
      automationLoopEnabled: "Keep weekly loop active",
      automationLoopDescription:
        "When enabled, the system automatically generates the next weekly agenda on Sunday if the upcoming week has not been generated yet.",
      topicsHistoryCleanupFrequency: "Topic history cleanup frequency",
      topicsHistoryCleanupDescription:
        "Choose how often the automation should clear the topic history automatically before starting fresh again.",
      cleanupFrequencyDisabled: "Do not clean automatically",
      cleanupFrequencyDaily: "Daily",
      cleanupFrequencyWeekly: "Weekly",
      cleanupFrequencyMonthly: "Monthly",
      services: "Services",
      contentRules: "Content rules",
      researchQueries: "Research queries",
      carouselDefaultStructure: "Default carousel structure",
      listHint: "Use one line per item in the lists above and below.",
      howItWorksTitle: "How this automation works",
      howItWorksDescription:
        "The agent uses this configuration as its operating brief. You can keep the default EcomForge positioning or rewrite everything to match another business. Repetition control now uses a compact topics history instead of storing full posts.",
      agendaTab: "Agenda",
      settingsTab: "Settings",
      scheduleLabel: "Weekly schedule",
      scheduleDescription:
        "Every Sunday the system researches current topics, checks the last 60 days of history, and generates the next plan based on the active days and times configured here.",
      weeklyAgendaTitle: "Weekly agenda rules",
      weeklyAgendaDescription:
        "Define the goal, content angles, preferred formats, active days, daily posting volume, and schedule times. The AI will follow this structure when building the next weekly plan.",
      enableAllDays: "Enable all days",
      disableAllDays: "Disable all days",
      dayEnabled: "Use this day",
      showMoreDay: "Show more",
      showLessDay: "Show less",
      dayPostsSummary: "posts scheduled",
      dayDisabledSummary: "Day disabled",
      noDayGoal: "No goal defined yet.",
      dayGoal: "Goal",
      dayTypes: "Content types",
      dayFormats: "Formats",
      postsPerDay: "Posts per day",
      postTimes: "Post times",
      postTimesHint:
        "Use one time per line in HH:mm. If you add fewer times than the quantity, the remaining slots will be filled automatically.",
      presetLibraryTitle: "Saved presets",
      presetLibraryDescription:
        "Save reusable goals, content types, and formats here. Each post can choose a saved preset or stay automatic.",
      goalPresets: "Goal presets",
      contentTypePresets: "Content type presets",
      formatPresets: "Format presets",
      savedPresetsHint:
        "Use one line per preset. In each post card, click a saved option or leave the field empty for AI to define it automatically.",
      autoGenerateField: "Automatic",
      autoGenerateHint:
        "Use the + button and choose Automatic if you want the system to generate this automatically for this post.",
      autoGeneratingField: "Generating...",
      autoGenerateSectionHint:
        "Use Automatic to regenerate this field with AI while preserving the current intent as a base.",
      autoGenerateAll: "Automatic all",
      chooseSavedPreset: "Choose from saved presets",
      noSavedPresets: "No saved presets yet. Add them in the settings tab.",
      singlePostLabel: "post",
      multiplePostsLabel: "posts",
      postLabel: "Post",
      saveButton: "Save settings",
      saving: "Saving...",
      saveSuccess: "Content automation settings saved successfully.",
      saveError: "Unable to save content automation settings.",
      generateButton: "Generate weekly agenda now",
      generating: "Generating...",
      generateHint:
        "When you generate now, the system saves this configuration first and then creates a fresh weekly agenda with current topics.",
      generateSuccess: "Weekly content agenda generated successfully.",
      generateError: "Unable to generate the weekly content agenda.",
      currentTopics: "Current topics found",
      topicsHistoryTitle: "Topic history",
      topicsHistoryDescription:
        "This compact history is what the automation uses to avoid repeating the same subjects in future agendas.",
      clearTopicsHistory: "Clear topic history",
      clearTopicsHistorySuccess: "Topic history cleared successfully.",
      clearTopicsHistoryError: "Unable to clear the topic history.",
      noTopicsHistory: "No topic history saved yet.",
      generatedAgendaTitle: "Generated weekly agenda",
      generatedAgendaDescription:
        "Review the plan that will feed your content creation workflow, including structure, caption, visual idea, and CTA.",
      noAgenda: "No weekly agenda has been generated yet.",
      structure: "Structure",
      visualIdea: "Visual idea",
      strategySection: "Brand strategy",
      strategyDescription: "Core positioning, editable brief, and the automation controls that define how the system should behave.",
      automationSection: "Automation controls",
      automationDescription: "Save settings, run planning, and review the current topic signals collected from external research.",
      sourcesSection: "Knowledge base",
      sourcesDescription: "Services, rules, research prompts, and the default carousel narrative used by the planner.",
      memorySection: "Topic memory",
      memoryDescription: "This is the compact anti-repetition memory used to avoid recycling the same subject too often.",
      agendaRulesSection: "Weekly cadence rules",
      agendaRulesDescription: "Define the role of each weekday so the planner keeps a clear editorial rhythm.",
      generatedSection: "Generated plan",
      generatedDescription: "Inspect the current weekly plan in a dedicated section before creating or publishing anything."
    },
    automationDiagnostics: {
      eyebrow: "Diagnostics",
      title: "Automation diagnostics",
      description:
        "Run the cron automations manually and inspect the live response without waiting for the scheduled time.",
      helpTitle: "How to use this page",
      helpDescription:
        "Each action below triggers the same backend automation used by the scheduler. Run one action at a time and review the returned JSON to confirm the workflow is behaving correctly.",
      generateWeeklyTitle: "Generate weekly content agenda",
      generateWeeklyDescription:
        "Runs the weekly content planning automation and shows whether the agenda was generated or skipped.",
      clearTopicsTitle: "Run topics history cleanup",
      clearTopicsDescription:
        "Runs the automatic topics history cleanup using the frequency configured in content automation settings.",
      publishScheduledTitle: "Publish scheduled posts",
      publishScheduledDescription:
        "Processes posts whose scheduled time has already arrived and attempts publication immediately.",
      publishWeeklyPreviewTitle: "Publish the whole weekly agenda now",
      publishWeeklyPreviewDescription:
        "Uses the current weekly agenda to generate and publish every item in sequence so you can inspect how the week would look in practice.",
      publishWeeklyPreviewDay: "Agenda day to publish",
      publishWeeklyPreviewAllDays: "Publish the full week",
      refreshTokensTitle: "Refresh Instagram tokens",
      refreshTokensDescription:
        "Refreshes saved Instagram access tokens for connected accounts.",
      runAction: "Run automation",
      running: "Running...",
      lastStatus: "Last status",
      notRunYet: "Not run yet",
      requestFailed: "The request failed.",
      summaryLabel: "Summary:",
      weeklySkipped: "the weekly plan was skipped because it already exists",
      cleanupSkipped: "cleanup skipped for today",
      itemsGenerated: "items generated",
      itemsCleared: "topics cleared",
      itemsProcessed: "scheduled posts processed",
      itemsPublished: "published",
      itemsFailed: "failed",
      tokensRefreshed: "tokens refreshed",
      awaitingRun: "Run this automation to see a human-readable summary here.",
      sectionRealtime: "Realtime feedback",
      sectionRealtimeDescription:
        "Every action returns the live backend response so you can validate the exact status without opening the terminal.",
      sectionSafety: "Safe testing",
      sectionSafetyDescription:
        "Use the day selector in the weekly publish test if you want to publish only one agenda item instead of the full week."
    }
  },
  "pt-BR": {
    common: {
      appName: "Publicador com IA",
      reviewDemo: "Demo de Revisao do Instagram",
      preview: "Previa",
      caption: "Legenda",
      status: "Status",
      connected: "Conectado",
      notConnected: "Nao conectado",
      pending: "Pendente",
      save: "Salvar",
      serverConnectionError:
        "Nao foi possivel conectar ao servidor do app. Verifique se o npm run dev continua ativo e tente novamente."
    },
    language: {
      label: "Idioma",
      en: "Ingles",
      ptBR: "Portugues (Brasil)"
    },
    sidebar: {
      dashboard: "Painel",
      connectInstagram: "Conectar Instagram",
      createPost: "Criar Post",
      scheduledPosts: "Posts Agendados",
      contentAutomation: "Automacao de Conteudo",
      automationDiagnostics: "Diagnostico das Automacoes"
    },
    login: {
      title: "Entrar",
      description:
        "Entre com sua conta existente para gerenciar conexoes do Instagram, geracao de conteudo e publicacoes.",
      email: "Email",
      password: "Senha",
      forgotPassword: "Esqueceu sua senha?",
      createAccount: "Criar conta",
      emailPlaceholder: "revisor@exemplo.com",
      passwordPlaceholder: "minimo de 8 caracteres",
      submit: "Entrar",
      submitting: "Entrando...",
      continueError: "Nao foi possivel continuar."
    },
    register: {
      title: "Criar Conta",
      description:
        "Crie sua conta com uma senha segura para que cada usuario tenha seu proprio espaco protegido.",
      email: "Email",
      password: "Senha",
      confirmPassword: "Confirmar senha",
      emailPlaceholder: "revisor@exemplo.com",
      passwordPlaceholder: "minimo de 8 caracteres",
      confirmPasswordPlaceholder: "Repita sua senha",
      submit: "Criar conta",
      submitting: "Criando conta...",
      loginLink: "Ja tem conta? Entrar",
      passwordMismatch: "As senhas nao coincidem.",
      continueError: "Nao foi possivel criar sua conta."
    },
    forgotPassword: {
      title: "Redefinir Senha",
      description:
        "Informe seu email e vamos gerar um link seguro de redefinicao caso a conta exista.",
      email: "Email",
      emailPlaceholder: "revisor@exemplo.com",
      submit: "Enviar link de redefinicao",
      submitting: "Enviando link...",
      success:
        "Se este email existir, um link de redefinicao foi gerado. Em desenvolvimento, o link pode aparecer abaixo.",
      loginLink: "Voltar para o login",
      continueError: "Nao foi possivel solicitar a redefinicao de senha.",
      devLinkLabel: "Link de redefinicao em desenvolvimento"
    },
    resetPassword: {
      title: "Escolher Nova Senha",
      description:
        "Crie uma nova senha para recuperar o acesso a sua conta. As sessoes antigas serao encerradas.",
      password: "Nova senha",
      confirmPassword: "Confirmar nova senha",
      passwordPlaceholder: "minimo de 8 caracteres",
      confirmPasswordPlaceholder: "Repita sua nova senha",
      submit: "Salvar nova senha",
      submitting: "Salvando senha...",
      success: "Senha atualizada com sucesso. Redirecionando para o dashboard...",
      invalidToken: "Este link de redefinicao esta ausente ou e invalido.",
      loginLink: "Voltar para o login",
      passwordMismatch: "As senhas nao coincidem.",
      continueError: "Nao foi possivel redefinir a senha."
    },
    dashboard: {
      eyebrow: "Painel",
      title: "Workspace de publicacao no Instagram",
      description: (email) =>
        `Conectado como ${email}. Conecte a conta do Instagram, gere conteudo com IA, visualize a previa e publique ou agende para o fluxo de revisao da Meta.`,
      logout: "Sair",
      connectedSuccess: "Conta do Instagram conectada com sucesso.",
      publishedSuccess: "Post publicado com sucesso.",
      connectionStatus: "Status da conexao",
      scheduledPosts: "Posts agendados",
      publishedPosts: "Posts publicados",
      noAccountTitle: "Nenhuma conta conectada ainda",
      noAccountDescription:
        "Conecte uma conta profissional do Instagram para liberar a geracao e publicacao com IA.",
      connectInstagram: "Conectar Instagram",
      quickActions: "Acoes rapidas",
      createPost: "Criar Post",
      viewScheduledPosts: "Ver Posts Agendados",
      connectedAccount: "Conta do Instagram conectada"
    },
    connectInstagram: {
      eyebrow: "OAuth do Instagram",
      title: "Conectar conta do Instagram",
      description:
        "Autorize uma conta profissional do Instagram com instagram_business_basic e instagram_business_content_publish para que o app possa buscar dados do perfil, renderizar assets e publicar posts.",
      body:
        "Quando voce clicar no botao abaixo, o app redireciona para o OAuth do Instagram. Apos a aprovacao, o callback troca o codigo por um token de acesso, busca o perfil, armazena tudo com seguranca no servidor e retorna voce ao painel.",
      button: "Conectar conta do Instagram"
    },
    createPost: {
      eyebrow: "Gerador com IA",
      title: "Criar post do Instagram",
      description:
        "Gere legenda, hashtags e um layout visual 1080x1080 com Ollama Cloud. Veja a previa, edite o texto, substitua a imagem se quiser, e depois publique ou agende."
    },
    generator: {
      contentTab: "Conteudo",
      settingsTab: "Configuracoes",
      topic: "Produto ou tema",
      topicPlaceholder: "Lancamento de skincare de primavera",
      message: "Promocao ou mensagem",
      messagePlaceholder:
        "Promova a oferta de lancamento por tempo limitado e destaque os ingredientes naturais.",
      postType: "Tipo de post",
      postTypeFeed: "Feed",
      postTypeStory: "Story",
      postTypeCarousel: "Carrossel",
      carouselSlides: "Planejamento do carrossel",
      carouselSlidesDescription: "Escolha quantos slides deseja gerar e, se quiser, descreva o objetivo de cada um. Se ficar em branco, a IA vai inferir a narrativa.",
      carouselSlidesCount: "Quantidade de slides",
      carouselSlideContextLabel: "Contexto do slide",
      carouselSlideContextPlaceholder: "Opcional. Exemplo: prova social, destaque de recurso, preco, CTA.",
      carouselDefaultStructure: "Estrutura padrao do carrossel",
      carouselDefaultStructureDescription: "1 capa com hook, 2 problema/contexto, slides do meio para valor, penultimo slide para insight e ultimo slide para CTA. Voce pode editar qualquer contexto.",
      restoreCarouselStructure: "Restaurar estrutura do carrossel",
      storyMode: "Formato do story",
      storyModeImageOnly: "Somente imagem",
      storyModeWithCaption: "Imagem + legenda",
      storyModeDescription: "Escolha se este story deve ser publicado apenas como imagem ou manter uma legenda no seu fluxo.",
      tone: "Tom",
      toneProfessional: "Profissional",
      toneCasual: "Casual",
      tonePromotional: "Promocional",
      outputLanguage: "Idioma de saida",
      outputLanguageDescription: "Escolha o idioma usado na legenda e nos textos renderizados dentro da imagem gerada.",
      outputLanguageEnglish: "Ingles",
      outputLanguagePtBR: "Portugues (Brasil)",
      briefingMode: "Configuracao do briefing",
      briefingModeDescription: "Escolha se deseja montar o briefing por pontos-chave do negocio ou escrever o prompt completo manualmente.",
      briefingModeGuided: "Briefing guiado",
      briefingModeGuidedDescription: "Preencha os pontos estrategicos mais importantes e deixe o app montar o briefing final.",
      briefingModePrompt: "Prompt completo",
      briefingModePromptDescription: "Escreva a instrucao inteira manualmente quando quiser controle total sobre o briefing.",
      guidedBriefingTitle: "Formulario de briefing guiado",
      guidedBriefingDescription: "Use estes 10 pontos para dar um contexto estrategico mais forte antes da IA escrever os conteudos e visuais.",
      guidedBriefingPreview: "Previa do briefing gerado",
      guidedBriefingPreviewDescription: "Este e o briefing final que sera enviado para a IA enquanto o modo guiado estiver ativo.",
      restoreGuidedBriefing: "Limpar briefing guiado",
      briefingBusinessSummary: "Resumo do negocio",
      briefingTargetAudience: "Publico-alvo",
      briefingMainObjective: "Objetivo principal",
      briefingProductsOrServices: "Produtos ou servicos",
      briefingBrandVoice: "Voz da marca",
      briefingDifferentiators: "Diferenciais",
      briefingPainPoints: "Dores que devem ser abordadas",
      briefingContentPillars: "Pilares de conteudo",
      briefingCtaPreference: "CTA preferido",
      briefingRestrictions: "Restricoes e regras",
      customInstructions: "Formula do prompt",
      customInstructionsDescription: "Personalize a instrucao base enviada para a IA. Voce pode manter a formula padrao ou reescrever para combinar com a voz da sua marca.",
      customInstructionsPlaceholder: "Voce e um especialista em estrategia de conteudo para Instagram e design visual.",
      restoreDefaultInstructions: "Restaurar formula padrao",
      settingsSaved: "Configuracoes salvas com sucesso.",
      settingsSaveError: "Nao foi possivel salvar as configuracoes.",
      removeMedia: "Remover",
      carouselCount: "Itens do carrossel",
      brandColors: "Cores da marca",
      brandColorsHint:
        "Este campo fica fora do preenchimento automatico. Salve as paletas aqui para manter a identidade da marca e poder reutilizar as cores depois de trocar.",
      keywords: "Palavras-chave opcionais",
      keywordsPlaceholder: "beleza limpa, lancamento, oferta limitada",
      generate: "Gerar Post",
      generating: "Gerando...",
      generationProgress: "Gerando seu post",
      generationEstimate: (formattedTimeout, carouselSlideCount) =>
        carouselSlideCount
          ? `Limite estimado: cerca de ${formattedTimeout} no total para este carrossel, com 4 minutos extras adicionados por slide.`
          : `Limite estimado: cerca de ${formattedTimeout} no total enquanto a IA escreve e renderiza a imagem.`,
      generationElapsed: "Tempo decorrido",
      generationSlow: "Ainda estamos processando. Se chegar perto do limite, vamos mostrar timeout em vez de parecer travado.",
      cancelGeneration: "Cancelar geracao",
      generationCanceled: "Geracao cancelada.",
      clearGeneratedPost: "Limpar post atual",
      editCaption: "Editar legenda",
      publishNow: "Publicar agora",
      publishing: "Publicando...",
      saveSchedule: "Salvar agendamento",
      scheduleTimeRequired: "Escolha um horario antes de salvar.",
      generateError: "Nao foi possivel gerar o post.",
      publishError: "Nao foi possivel publicar.",
      scheduleError: "Nao foi possivel agendar.",
      autoGenerateField: "Automatico",
      autoGeneratingField: "Gerando...",
      autoGenerateAllFields: "Automatico geral",
      autoGenerateHint:
        "Usa a estrategia salva e o que ja estiver preenchido como base para manter coerencia no resultado."
    },
    upload: {
      title: "Enviar imagem personalizada",
      description: "Ao enviar uma imagem, ela substitui a previa gerada por IA na publicacao.",
      carouselTitle: "Enviar imagens do carrossel",
      carouselDescription:
        "Adicione entre 2 e 10 imagens. A imagem gerada pode ser o primeiro slide, e os uploads extras completam o carrossel.",
      markAsAiGenerated: "Marcar imagens enviadas como geradas por IA",
      markAsAiGeneratedDescription:
        "Use esta opcao se as imagens enviadas tambem foram criadas com IA e devem receber a mesma marcacao de metadados.",
      uploading: "Enviando...",
      error: "Falha no upload."
    },
    preview: {
      imageAlt: "Previa do post gerado",
      empty: "Gere um post para visualizar a previa aqui",
      noCaption: "Ainda nao ha legenda.",
      previous: "Anterior",
      next: "Proximo",
      downloadPost: "Baixar post",
      downloadCurrentSlide: "Baixar slide atual"
    },
    scheduler: {
      label: "Horario do agendamento"
    },
    instagramCard: {
      title: "Conta do Instagram conectada",
      username: "Usuario",
      instagramId: "ID do Instagram",
      connectionStatus: "Status da conexao"
    },
    scheduledPage: {
      eyebrow: "Fila",
      title: "Posts agendados",
      description:
        "Acompanhe o conteudo aguardando publicacao, assim como os itens ja publicados, para o seu roteiro de revisao.",
      savedSuccess: "Post agendado salvo com sucesso.",
      updatedSuccess: "Horario agendado atualizado com sucesso.",
      updateError: "Nao foi possivel atualizar o horario agendado.",
      scheduleRequired: "Escolha uma nova data e horario antes de salvar.",
      preview: "Previa",
      caption: "Legenda",
      scheduledTime: "Horario agendado",
      publishedAt: "Publicado em",
      status: "Status",
      fileStatus: "Arquivo",
      scheduledStatus: "Agendado",
      publishedStatus: "Publicado",
      failedStatus: "Falhou",
      publicationStatePublished: "Ainda publicado",
      publicationStateArchived: "Arquivado",
      publicationStateDeleted: "Excluido",
      fileAvailable: "Disponivel",
      fileDeleted: "Excluido",
      fileRemote: "Armazenado remotamente",
      editSchedule: "Alterar data",
      reschedule: "Reagendar",
      saving: "Salvando...",
      scheduledCount: "Agendados",
      publishedCount: "Publicados",
      processedCount: "Processados",
      previewUnavailable: "Sem previa",
      noPosts: "Ainda nao ha posts agendados ou publicados.",
      previewAlt: "Previa do post",
      select: "Selecionar",
      selectAll: "Selecionar todos os posts listados",
      deleteSelected: "Apagar selecionados",
      deleting: "Apagando...",
      clearSelection: "Limpar",
      deleteSuccess: "Posts selecionados apagados com sucesso.",
      deleteError: "Nao foi possivel apagar os posts selecionados.",
      selectAtLeastOne: "Selecione pelo menos um post.",
      instagramFeedTitle: "Feed do Instagram",
      instagramFeedDescription: "Estes sao os itens mais recentes visiveis no feed da sua conta conectada.",
      instagramFeedEmpty: "O Instagram ainda nao retornou itens do feed.",
      instagramFeedError: "Nao foi possivel carregar o feed do Instagram",
      openOnInstagram: "Abrir no Instagram"
    },
    contentAutomation: {
      eyebrow: "Automacao",
      title: "Automacao semanal de conteudo",
      description:
        "Ajuste o briefing da marca, a logica editorial da semana e as pesquisas de temas usadas pelo agente de IA que planeja seus conteudos de Instagram todo domingo.",
      brandName: "Nome da marca",
      editableBrief: "Briefing editavel",
      automationLoopEnabled: "Manter loop semanal ativo",
      automationLoopDescription:
        "Quando ativado, o sistema gera automaticamente a proxima agenda semanal no domingo se a semana seguinte ainda nao tiver sido gerada.",
      topicsHistoryCleanupFrequency: "Frequencia da limpeza do historico de temas",
      topicsHistoryCleanupDescription:
        "Escolha com que frequencia a automacao deve limpar o historico de temas automaticamente antes de recomecar do zero.",
      cleanupFrequencyDisabled: "Nao limpar automaticamente",
      cleanupFrequencyDaily: "Diaria",
      cleanupFrequencyWeekly: "Semanal",
      cleanupFrequencyMonthly: "Mensal",
      services: "Servicos",
      contentRules: "Regras de conteudo",
      researchQueries: "Consultas de pesquisa",
      carouselDefaultStructure: "Estrutura padrao de carrossel",
      listHint: "Use uma linha por item nas listas acima e abaixo.",
      howItWorksTitle: "Como essa automacao funciona",
      howItWorksDescription:
        "O agente usa esta configuracao como briefing operacional. Voce pode manter o posicionamento padrao da EcomForge ou reescrever tudo para outra empresa. O controle de repeticao agora usa um historico compacto de temas em vez de salvar posts completos.",
      agendaTab: "Agenda",
      settingsTab: "Configuracoes",
      scheduleLabel: "Agenda semanal",
      scheduleDescription:
        "Todo domingo o sistema pesquisa temas atuais, verifica o historico dos ultimos 60 dias e gera o proximo planejamento com base nos dias e horarios ativos configurados aqui.",
      weeklyAgendaTitle: "Regras da agenda semanal",
      weeklyAgendaDescription:
        "Defina o objetivo, os angulos de conteudo, os formatos preferidos, os dias ativos, a quantidade de posts por dia e os horarios de publicacao. A IA segue essa estrutura ao montar o proximo planejamento.",
      enableAllDays: "Ativar todos os dias",
      disableAllDays: "Desativar todos os dias",
      dayEnabled: "Usar este dia",
      showMoreDay: "Mostrar mais",
      showLessDay: "Mostrar menos",
      dayPostsSummary: "posts no dia",
      dayDisabledSummary: "Dia desativado",
      noDayGoal: "Nenhum objetivo definido ainda.",
      dayGoal: "Objetivo",
      dayTypes: "Tipos de conteudo",
      dayFormats: "Formatos",
      postsPerDay: "Posts por dia",
      postTimes: "Horarios dos posts",
      postTimesHint:
        "Use um horario por linha no formato HH:mm. Se informar menos horarios do que a quantidade, os demais slots serao preenchidos automaticamente.",
      presetLibraryTitle: "Presets salvos",
      presetLibraryDescription:
        "Salve aqui objetivos, tipos de conteudo e formatos reutilizaveis. Em cada post, voce pode escolher um preset salvo ou deixar automatico.",
      goalPresets: "Presets de objetivo",
      contentTypePresets: "Presets de tipos de conteudo",
      formatPresets: "Presets de formatos",
      savedPresetsHint:
        "Use uma linha por preset. Em cada card de post, clique em uma opcao salva ou deixe o campo vazio para a IA definir automaticamente.",
      autoGenerateField: "Automatico",
      autoGenerateHint:
        "Use o botao + e escolha Automatico se quiser que o sistema gere isso automaticamente para este post.",
      autoGeneratingField: "Gerando...",
      autoGenerateSectionHint:
        "Use Automatico para regenerar este campo com IA, preservando a intencao atual como base.",
      autoGenerateAll: "Automatico geral",
      chooseSavedPreset: "Escolher dos presets salvos",
      noSavedPresets: "Ainda nao existem presets salvos. Adicione-os na aba de configuracoes.",
      singlePostLabel: "post",
      multiplePostsLabel: "posts",
      postLabel: "Post",
      saveButton: "Salvar configuracoes",
      saving: "Salvando...",
      saveSuccess: "Configuracoes da automacao salvas com sucesso.",
      saveError: "Nao foi possivel salvar as configuracoes da automacao.",
      generateButton: "Gerar agenda semanal agora",
      generating: "Gerando...",
      generateHint:
        "Ao gerar agora, o sistema salva primeiro esta configuracao e depois monta uma agenda nova com temas atuais.",
      generateSuccess: "Agenda semanal gerada com sucesso.",
      generateError: "Nao foi possivel gerar a agenda semanal.",
      currentTopics: "Temas atuais encontrados",
      topicsHistoryTitle: "Historico de temas",
      topicsHistoryDescription:
        "Este historico compacto e o que a automacao usa para evitar repetir os mesmos assuntos nas proximas agendas.",
      clearTopicsHistory: "Limpar historico de temas",
      clearTopicsHistorySuccess: "Historico de temas limpo com sucesso.",
      clearTopicsHistoryError: "Nao foi possivel limpar o historico de temas.",
      noTopicsHistory: "Ainda nao existe historico de temas salvo.",
      generatedAgendaTitle: "Agenda semanal gerada",
      generatedAgendaDescription:
        "Revise o planejamento que vai alimentar seu fluxo de criacao, incluindo estrutura, legenda, ideia visual e CTA.",
      noAgenda: "Ainda nao existe uma agenda semanal gerada.",
      structure: "Estrutura",
      visualIdea: "Ideia visual",
      strategySection: "Estrategia da marca",
      strategyDescription: "Posicionamento central, briefing editavel e os controles principais que definem como a automacao deve se comportar.",
      automationSection: "Controles da automacao",
      automationDescription: "Salve configuracoes, rode o planejamento e acompanhe os temas atuais capturados na pesquisa.",
      sourcesSection: "Base de conhecimento",
      sourcesDescription: "Servicos, regras, pesquisas e a narrativa padrao de carrossel usada pelo planejador.",
      memorySection: "Memoria de temas",
      memoryDescription: "Esta e a memoria compacta anti-repeticao usada para evitar reciclar os mesmos assuntos com muita frequencia.",
      agendaRulesSection: "Regras da cadencia semanal",
      agendaRulesDescription: "Defina o papel de cada dia da semana para que o planejador mantenha um ritmo editorial claro.",
      generatedSection: "Plano gerado",
      generatedDescription: "Inspecione o planejamento semanal atual em uma secao dedicada antes de criar ou publicar qualquer coisa."
    },
    automationDiagnostics: {
      eyebrow: "Diagnostico",
      title: "Diagnostico das automacoes",
      description:
        "Dispare os crons manualmente e inspecione a resposta em tempo real sem precisar esperar o horario agendado.",
      helpTitle: "Como usar esta pagina",
      helpDescription:
        "Cada acao abaixo dispara a mesma automacao de backend usada pelo scheduler. Rode uma por vez e revise o JSON retornado para confirmar se o fluxo esta se comportando corretamente.",
      generateWeeklyTitle: "Gerar agenda semanal de conteudo",
      generateWeeklyDescription:
        "Executa a automacao de planejamento semanal e mostra se a agenda foi gerada ou ignorada.",
      clearTopicsTitle: "Executar limpeza do historico de temas",
      clearTopicsDescription:
        "Executa a limpeza automatica do historico de temas usando a frequencia configurada nas configuracoes da automacao.",
      publishScheduledTitle: "Publicar posts agendados",
      publishScheduledDescription:
        "Processa os posts cujo horario ja chegou e tenta publicar imediatamente.",
      publishWeeklyPreviewTitle: "Publicar a agenda semanal inteira agora",
      publishWeeklyPreviewDescription:
        "Usa a agenda semanal atual para gerar e publicar cada item em sequencia, assim voce consegue verificar como a semana ficaria na pratica.",
      publishWeeklyPreviewDay: "Dia da agenda para publicar",
      publishWeeklyPreviewAllDays: "Publicar a semana inteira",
      refreshTokensTitle: "Atualizar tokens do Instagram",
      refreshTokensDescription:
        "Atualiza os tokens de acesso do Instagram das contas conectadas.",
      runAction: "Executar automacao",
      running: "Executando...",
      lastStatus: "Ultimo status",
      notRunYet: "Ainda nao executado",
      requestFailed: "A requisicao falhou.",
      summaryLabel: "Resumo:",
      weeklySkipped: "o plano semanal foi ignorado porque ja existe",
      cleanupSkipped: "a limpeza foi ignorada hoje",
      itemsGenerated: "itens gerados",
      itemsCleared: "temas limpos",
      itemsProcessed: "posts agendados processados",
      itemsPublished: "publicados",
      itemsFailed: "falharam",
      tokensRefreshed: "tokens atualizados",
      awaitingRun: "Execute esta automacao para ver um resumo humano aqui.",
      sectionRealtime: "Feedback em tempo real",
      sectionRealtimeDescription:
        "Cada acao retorna a resposta real do backend para que voce valide o status exato sem abrir o terminal.",
      sectionSafety: "Teste com seguranca",
      sectionSafetyDescription:
        "Use o seletor de dia na publicacao da agenda semanal se quiser disparar apenas um item em vez da semana inteira."
    }
  }
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
