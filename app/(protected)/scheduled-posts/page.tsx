import Image from "next/image";
import { PostStatus } from "@prisma/client";
import { Panel, SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";

export default async function ScheduledPostsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);
  const params = await searchParams;
  const posts = await prisma.post.findMany({
    where: {
      userId: user!.id,
      status: {
        in: [PostStatus.SCHEDULED, PostStatus.PUBLISHED, PostStatus.FAILED]
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.scheduledPage.eyebrow}
        title={dictionary.scheduledPage.title}
        description={dictionary.scheduledPage.description}
      />

      {params.saved ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {dictionary.scheduledPage.savedSuccess}
        </div>
      ) : null}

      <Panel className="mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">{dictionary.scheduledPage.preview}</th>
                <th className="px-4 py-3 font-medium">{dictionary.scheduledPage.caption}</th>
                <th className="px-4 py-3 font-medium">{dictionary.generator.postType}</th>
                <th className="px-4 py-3 font-medium">{dictionary.scheduledPage.scheduledTime}</th>
                <th className="px-4 py-3 font-medium">{dictionary.scheduledPage.status}</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                      <Image src={post.imageUrl} alt={dictionary.scheduledPage.previewAlt} fill className="object-cover" unoptimized />
                    </div>
                  </td>
                  <td className="max-w-md px-4 py-4 text-slate-700">
                    <p className="line-clamp-4 whitespace-pre-wrap">{post.caption}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {post.postType === "STORY"
                      ? dictionary.generator.postTypeStory
                      : post.postType === "CAROUSEL"
                        ? dictionary.generator.postTypeCarousel
                        : dictionary.generator.postTypeFeed}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {post.scheduledTime ? post.scheduledTime.toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {post.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    {dictionary.scheduledPage.noPosts}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
