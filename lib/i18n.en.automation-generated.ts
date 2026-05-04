export const enAutomationGeneratedLabels = {
  missingPlannedPostsNotice: "This day does not reflect the current configuration yet. Planned posts still missing to reach the expected count:",
  missingPostCardTitle: "Post {index} not planned yet",
  missingPostCardDescription:
    "This slot exists in the current weekly rule, but it is not present in the generated plan yet. You can keep the current agenda or generate a new one.",
  expiredSlotTitle: "Post {index} missed the configured time",
  expiredSlotDescription:
    "The configured time for this slot has already passed. If you still want to publish today, reschedule it to a new future time before saving the post.",
  outsidePlanPostLabel: "Post created outside the generated plan",
  outsidePlanPostDescription:
    "We found a real post already created/scheduled for this day even though there is no matching item in the weekly plan.",
  slotFilledByScheduledPostLabel: "Post manually created for this slot",
  slotFilledByScheduledPostDescription:
    "We found a real post already created/scheduled that fills the configured slot for this time.",
  outsidePlanPublishedDescription:
    "This post was published but is not linked to an explicit item in the weekly plan. Record at",
  outsidePlanScheduledDescription:
    "This post is scheduled but is not linked to an explicit item in the weekly plan. Scheduled at",
  outsidePlanDraftDescription:
    "This post already exists as a draft or pre-publication item, but it is not linked to an explicit item in the weekly plan.",
  notAvailableLabel: "Not available",
  staleAgendaTitle: "Weekly agenda is outside the current week",
  staleAgendaDescription:
    "We found an agenda from another week with posts that were not used. Do you want to keep those pending posts or generate a new agenda? Pending detected:",
  keepUnusedPosts: "Keep pending posts",
  resolvingStaleAgenda: "Saving choice...",
  generateNewAgendaHint: "If you prefer, use the generate weekly agenda button now to create a fresh plan.",
  carouselStatusLabel: "Viewing",
  carouselPrevious: "Previous",
  carouselNext: "Next",
  preGeneratingBadge: "Post {slot} being generated",
  preGeneratingCountdown: "Automatic preparation in progress. About {time} remaining.",
  preGeneratingCardDescription:
    "The AI is already preparing this post so everything is ready before the scheduled time. Estimated time remaining: {time}.",
  noAgenda: "No weekly agenda has been generated yet.",
  structure: "Structure",
  visualIdea: "Visual idea",
  postStatusNotGenerated: "Not generated",
  postStatusDraft: "Generated",
  postStatusScheduled: "Scheduled",
  postStatusPublishing: "Generating/publishing",
  postStatusPublished: "Published",
  postStatusFailed: "Failed",
  postStatusNotGeneratedDescription:
    "This agenda item has not become a saved post yet. The plan exists, but post generation has not happened.",
  postStatusDraftDescription:
    "This item has already been generated and saved as a draft, but it does not have a schedule yet.",
  postStatusScheduledDescription:
    "This item has already been generated and scheduled for publication at",
  postStatusPublishingDescription:
    "This item is already in the publishing flow and is still being processed.",
  postStatusPublishedDescription:
    "This agenda item has already been published. Latest record at",
  postStatusFailedDescription:
    "The generation/publication flow for this item failed. Review the saved post or try generating it again.",
  publicationStatePublished: "Active",
  publicationStateArchived: "Archived",
  publicationStateDeleted: "Deleted",
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
};
