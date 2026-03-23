'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, Lightbulb, Code, ChevronDown, ChevronUp, User } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  user: { full_name: string; email: string };
  parent_id: string | null;
  is_hint: boolean;
  hint_cost_points: number;
  upvotes: number;
  downvotes: number;
  code_language: string | null;
  created_at: string;
  replies?: Comment[];
  user_vote?: { vote_type: 'upvote' | 'downvote' } | null;
}

interface CommentsPanelProps {
  challengeId: string;
}

export default function CommentsPanel({ challengeId }: CommentsPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');

  useEffect(() => {
    fetchComments();
  }, [challengeId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id(full_name, email),
          comment_votes!left(vote_type, user_id)
        `)
        .eq('challenge_id', challengeId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (data) {
        // Transform data and get replies
        const commentsWithVotes = await Promise.all(
          data.map(async (comment: any) => {
            const userVote = comment.comment_votes?.find((v: any) => v.user_id === user?.id);

            // Get replies
            const { data: replies } = await supabase
              .from('comments')
              .select(`
                *,
                user:user_id(full_name, email),
                comment_votes!left(vote_type, user_id)
              `)
              .eq('parent_id', comment.id)
              .order('created_at', { ascending: true });

            const repliesWithVotes = (replies || []).map((reply: any) => ({
              ...reply,
              user_vote: reply.comment_votes?.find((v: any) => v.user_id === user?.id),
            }));

            return {
              ...comment,
              user_vote: userVote ? { vote_type: userVote.vote_type } : null,
              replies: repliesWithVotes,
            };
          })
        );
        setComments(commentsWithVotes);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: null,
      })
      .select('*, user:user_id(full_name, email)')
      .single();

    if (!error && data) {
      setComments([{ ...data, replies: [], user_vote: null }, ...comments]);
      setNewComment('');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      })
      .select('*, user:user_id(full_name, email)')
      .single();

    if (!error && data) {
      setComments(comments.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...data, user_vote: null }] }
          : c
      ));
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;

    // Check if user already voted
    const { data: existing } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await supabase.from('comment_votes').delete().eq('id', existing.id);
      } else {
        // Change vote
        await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
    } else {
      // Add vote
      await supabase.from('comment_votes').insert({
        comment_id: commentId,
        user_id: user.id,
        vote_type: voteType,
      });
    }

    await fetchComments();
  };

  const sortComments = (comments: Comment[]) => {
    if (sortBy === 'top') {
      return [...comments].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }
    return comments;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sortedComments = sortComments(comments);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Discussions ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              showHints ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'top')}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">Newest</option>
            <option value="top">Top</option>
          </select>
        </div>
      </div>

      {/* New Comment */}
      {user && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts, ask questions, or help others..."
            className="w-full border rounded-lg p-3 min-h-[100px] resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Post Comment
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">You must be logged in to participate in discussions.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="bg-white border rounded-lg">
            {/* Comment Header */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                  {getInitials(comment.user?.full_name || comment.user?.email || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{comment.user?.full_name || comment.user?.email}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {comment.is_hint && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Hint
                      </span>
                    )}
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">{comment.content}</div>

                  {/* Code Block if exists */}
                  {comment.code_language && (
                    <div className="mt-3 bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Code className="w-3 h-3" />
                        {comment.code_language}
                      </div>
                      <pre className="text-sm text-gray-100">{comment.content}</pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleVote(comment.id, 'upvote')}
                      className={`flex items-center gap-1 text-sm ${
                        comment.user_vote?.vote_type === 'upvote' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {comment.upvotes}
                    </button>
                    <button
                      onClick={() => handleVote(comment.id, 'downvote')}
                      className={`flex items-center gap-1 text-sm ${
                        comment.user_vote?.vote_type === 'downvote' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      {comment.downvotes}
                    </button>
                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full border rounded-lg p-2 min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-600 px-3 py-1 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className="bg-primary-600 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="border-t bg-gray-50">
                <div className="p-4 pl-16 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(reply.user?.full_name || reply.user?.email || 'U')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{reply.user?.full_name || reply.user?.email}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedComments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No discussions yet.</p>
            <p className="text-sm">Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
