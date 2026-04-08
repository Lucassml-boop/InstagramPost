import { CaptionGenerator } from "@/components/CaptionGenerator";
import { SectionTitle } from "@/components/ui";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function CreatePostPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.createPost.eyebrow}
        title={dictionary.createPost.title}
        description={dictionary.createPost.description}
      />
      <div className="mt-8">
        <CaptionGenerator />
      </div>
    </div>
  );
}
