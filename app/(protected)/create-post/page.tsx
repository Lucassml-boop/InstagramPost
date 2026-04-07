import { CaptionGenerator } from "@/components/CaptionGenerator";
import { SectionTitle } from "@/components/ui";

export default function CreatePostPage() {
  return (
    <div>
      <SectionTitle
        eyebrow="AI Generator"
        title="Create Instagram Post"
        description="Generate a caption, hashtags, and a 1080x1080 visual layout with OpenAI. Preview it, edit the copy, optionally replace the image, then publish or schedule it."
      />
      <div className="mt-8">
        <CaptionGenerator />
      </div>
    </div>
  );
}
