import posthog from "posthog-js";

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    disable_surveys: true,
    disable_web_experiments: true,
    mask_all_text: true,
    defaults: "2025-05-24",
    debug: process.env.NODE_ENV === "development",
  })
}
