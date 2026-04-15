import { useEffect, useState } from 'react'
import apiService from '../services/common'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, Newspaper, GraduationCap, Star } from 'lucide-react'
import Comment from './Comment'
import Waiting from './Waiting';
import PageMeta from './PageMeta';
import { getMediaUrl } from '../utils/formatDate';

interface User {
    id: number;
    name: string;
    slug?: string;
    avatar?: string;
    avatar_url?: string;
    image?: string;
    photo?: string;
    profile_photo_url?: string;
}

interface Category {
    id: number;
    name: string;
    slug?: string;
}

interface Tag {
    id?: number;
    slug?: string;
    name: string;
}

interface PostDetailData {
    id: number;
    slug?: string;
    name: string;
    description: string;
    thumbnail?: string;
    avatar?: string;
    user_avatar?: string;
    type?: "article" | "news" | "tutorial" | "review";
    content: string;
    allow_comments?: boolean;
    user?: User;
    category?: Category;
    tags?: Tag[];
    comments?: unknown;
}

const getAuthorAvatar = (post: PostDetailData): string => {
    const user = post.user;
    return (
        post.user_avatar ||
        user?.avatar ||
        user?.avatar_url ||
        user?.image ||
        user?.photo ||
        user?.profile_photo_url ||
        ""
    );
}

interface ApiEnvelope<T> {
    data?: T;
}

const getResponseData = <T,>(response: ApiEnvelope<T | ApiEnvelope<T>> | undefined): T | null => {
    const payload = response?.data;
    if (!payload) return null;

    if (typeof payload === "object" && payload !== null && "data" in payload) {
        return (payload as ApiEnvelope<T>).data ?? null;
    }

    return payload as T;
}

const toSlug = (value: string): string => {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

const typeConfig = {
    article: { icon: BookOpen, label: "Bài viết", color: "blue" },
    news: { icon: Newspaper, label: "Tin tức", color: "red" },
    tutorial: { icon: GraduationCap, label: "Hướng dẫn", color: "green" },
    review: { icon: Star, label: "Đánh giá", color: "yellow" }
};

const getTypeStyles = (color: string) => {
    const styles = {
        blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200",
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
        green: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200",
        yellow: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200"
    };
    return styles[color as keyof typeof styles] || styles.blue;
};

function PostDetail() {
    const { slug } = useParams()
    const [post, setPost] = useState<PostDetailData | null>(null)
    const [comments, setComments] = useState<unknown[]>([])

    const renderTypeIcon = () => {
        if (!post?.type || !typeConfig[post.type]) return null;
        const config = typeConfig[post.type];
        const IconComponent = config.icon;
        return <IconComponent size={14} />;
    };

    useEffect(() => {
        if (!slug) {
            setPost(null)
            setComments([])
            return
        }

        let cancelled = false

        apiService.get(`client/post/${slug}`)
            .then(response => {
                if (cancelled) return

                const postData = getResponseData<PostDetailData>(response)
                if (!postData || typeof postData !== "object" || !("id" in postData)) {
                    setPost(null)
                    setComments([])
                    return
                }

                setPost(postData)

                setComments(Array.isArray(postData.comments) ? postData.comments : [])

                apiService.get(`client/post/${slug}/comments`)
                    .then(commentResponse => {
                        if (cancelled) return
                        const serverComments = getResponseData<unknown[]>(commentResponse)
                        if (Array.isArray(serverComments)) {
                            setComments(serverComments)
                        }
                    })
                    .catch(error => {
                        if (cancelled) return
                        console.error("Error fetching comments:", error)
                    })
            })
            .catch(error => {
                if (cancelled) return
                setPost(null)
                setComments([])
                console.error("Error fetching post:", error)
            })

        return () => {
            cancelled = true
        }
    }, [slug])

    return (
        <div className="max-w-4xl w-full mx-auto mb-4 break-words min-w-0 p-4 sm:p-5">
            {post && (
                <PageMeta
                    title={post.name}
                    description={post.description || "Chi ti?t b?i vi?t tr?n blog."}
                    image={post.thumbnail || post.avatar || undefined}
                />
            )}
            {!post && <Waiting />}
            {post &&
                <article className="p-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <strong>
                            <Link to={`/category/${post.category?.slug || post.category?.id}`} className='inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:border-slate-600 dark:bg-slate-800 dark:text-sky-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'>
                                {post.category?.name || "Uncategorized"}
                            </Link>
                        </strong>
                        {post.type && typeConfig[post.type] && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${getTypeStyles(typeConfig[post.type].color)}`}>
                                {renderTypeIcon()}
                                {typeConfig[post.type].label}
                            </span>
                        )}
                    </div>
                    <h1 className='text-2xl sm:text-3xl mt-2 mb-2 font-bold leading-tight dark:text-slate-100'>{post.name}</h1>
                    <img src={getMediaUrl(post.avatar)} className="rounded-lg" />
                    <p className="mt-2 text-slate-700 font-bold my-2 dark:text-slate-300">{post.description}</p>
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <Link
                                    key={tag.slug || tag.id || tag.name}
                                    to={tag.slug ? `/tag/${encodeURIComponent(tag.slug)}` : `/?tag=${encodeURIComponent(tag.name)}`}
                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    )}
                    <div
                        className="post-content prose prose-sm sm:prose max-w-none overflow-hidden dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_table]:block [&_table]:overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: post.content.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ') }}
                    />
                    <div className="mt-4 mb-1">
                        <Link
                            to={`/user/${post.user?.slug || (post.user?.name ? toSlug(post.user.name) : post.user?.id)}`}
                            className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-white to-slate-50 px-3 py-2 transition-colors hover:from-sky-50 hover:to-white dark:from-slate-900 dark:to-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-900"
                        >
                            {getAuthorAvatar(post) ? (
                                <img
                                    src={getAuthorAvatar(post)}
                                    alt={post.user?.name || "Author"}
                                    className="h-9 w-9 rounded-full object-cover border border-sky-200 dark:border-slate-600"
                                />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center dark:bg-slate-700 dark:text-slate-100">
                                    {(post.user?.name?.charAt(0) || "U").toUpperCase()}
                                </div>
                            )}
                            <div className="leading-tight">
                                <p className="text-[11px] uppercase tracking-wide text-sky-600 font-semibold dark:text-sky-300">Tác giả</p>
                                <p className="text-sm font-medium text-slate-800 hover:text-sky-800 dark:text-slate-100 dark:hover:text-sky-200">
                                    {post.user?.name || "Unknown Author"}
                                </p>
                            </div>
                        </Link>
                    </div>
                    {post ? <Comment key={slug} comments={comments} postSlug={slug || ""} canComment={Boolean(post.allow_comments)} /> : null}
                </article>
            }
        </div>
    );
}
export default PostDetail
