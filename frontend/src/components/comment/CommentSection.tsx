'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commentApi } from '@/lib/strapi';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, Reply, MessageSquare } from 'lucide-react';

const commentSchema = z.object({
  content: z.string().min(3, 'Comment must be at least 3 characters').max(1000),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface Props {
  blogId:          number;
  initialComments: Comment[];
}

function CommentItem({ comment, blogId }: { comment: Comment; blogId: number }) {
  const [showReply, setShowReply] = useState(false);
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const replyMutation = useMutation({
    mutationFn: (data: CommentFormData) =>
      commentApi.create({ content: data.content, blogId, parentCommentId: comment.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', blogId] });
      reset();
      setShowReply(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => commentApi.like(comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', blogId] }),
  });

  const authorName = comment.author
    ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || comment.author.username
    : 'Anonymous';

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-semibold text-sm">
        {authorName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={!isAuthenticated}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <ThumbsUp className="h-3 w-3" />
            {comment.likeCount || 0}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setShowReply((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <form onSubmit={handleSubmit((d) => replyMutation.mutate(d))} className="mt-3">
            <textarea
              {...register('content')}
              rows={2}
              placeholder="Write a reply..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.content && (
              <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={replyMutation.isPending}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-50"
              >
                {replyMutation.isPending ? 'Posting...' : 'Reply'}
              </button>
              <button type="button" onClick={() => setShowReply(false)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} blogId={blogId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ blogId, initialComments }: Props) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey:     ['comments', blogId],
    queryFn:      () => commentApi.getByBlog(blogId).then((r) => r.data),
    initialData:  { data: initialComments, meta: {} },
    staleTime:    60 * 1000,
  });

  const comments = (data?.data as Comment[]) || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (d: CommentFormData) => commentApi.create({ content: d.content, blogId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', blogId] });
      reset();
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>
      </div>

      {/* New comment form */}
      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="mb-10 p-4 rounded-xl border bg-card"
        >
          <textarea
            {...register('content')}
            rows={4}
            placeholder="Share your thoughts..."
            className="w-full bg-background rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.content && (
            <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {createMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
          {createMutation.isSuccess && (
            <p className="text-sm text-green-600 mt-2">
              Comment posted! It may be pending moderation.
            </p>
          )}
        </form>
      ) : (
        <div className="mb-10 p-6 rounded-xl border bg-muted/40 text-center">
          <p className="text-sm text-muted-foreground mb-3">Login to join the conversation</p>
          <a href="/login" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Login to Comment
          </a>
        </div>
      )}

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} blogId={blogId} />
          ))}
        </div>
      )}
    </div>
  );
}
