import { CaptionGenerator } from "@/components/create-post";
import { SectionTitle } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function CreatePostPage() {
  const locale = await getLocaleFromCookies();
  const user = await getCurrentUser();
  const dictionary = getDictionary(locale);

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.createPost.eyebrow}
        title={dictionary.createPost.title}
        description={dictionary.createPost.description}
      />
      <div className="mt-8">
        <CaptionGenerator
          initialOutputLanguage={user?.preferredOutputLanguage === "pt-BR" ? "pt-BR" : "en"}
          initialCustomInstructions={
            sanitizeCustomInstructions(user?.preferredCustomInstructions) ||
            "You are an expert Instagram content strategist and visual designer."
          }
        />
      </div>
    </div>
  );
}
