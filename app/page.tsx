'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reply {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  text: string;
  time: string;
}

interface CommentEntry {
  kind: 'comment';
  id: string;
  entryNo: number;
  author: string;
  initials: string;
  avatarColor: string;
  text: string;
  time: string;
  timestamp: number;
  replies: Reply[];
}

interface ActivityEntry {
  kind: 'activity';
  id: string;
  type: 'update' | 'assign' | 'system' | 'due' | 'status';
  actor: string;
  text: string;
  time: string;
  timestamp: number;
}

type FeedEntry = CommentEntry | ActivityEntry;

// ─── Sample Data ─────────────────────────────────────────────────────────────

const INITIAL_DATA: FeedEntry[] = [
  {
    kind: 'activity',
    id: 'a1',
    type: 'due',
    actor: 'Sam',
    text: 'Sam set the due date to 5/25/26',
    time: 'May 25 at 7:14 am',
    timestamp: 1716624840,
  },
  {
    kind: 'comment',
    id: 'c1',
    entryNo: 1001,
    author: 'Kathleen Batula',
    initials: 'KB',
    avatarColor: '#e8a838',
    text: 'hi @Sam, if this is not urgent, this can be delegated to John as he was the one that created the +61 logic.',
    time: 'May 25 at 7:27 am',
    timestamp: 1716625620,
    replies: [
      {
        id: 'r1',
        author: 'Sam',
        initials: 'SA',
        avatarColor: '#4a90d9',
        text: 'Wonderful, thank you for the update.',
        time: 'May 25 at 7:44 am',
      },
    ],
  },
  {
    kind: 'activity',
    id: 'a2',
    type: 'assign',
    actor: 'Kathleen Batula',
    text: 'Kathleen Batula removed assignee: Kathleen Batula',
    time: 'May 25 at 7:27 am',
    timestamp: 1716625621,
  },
  {
    kind: 'activity',
    id: 'a3',
    type: 'assign',
    actor: 'Kathleen Batula',
    text: 'Kathleen Batula assigned to: Sam',
    time: 'May 25 at 7:27 am',
    timestamp: 1716625622,
  },
  {
    kind: 'activity',
    id: 'a4',
    type: 'update',
    actor: 'Kathleen Batula',
    text: 'Kathleen Batula added follower: Sam',
    time: 'May 25 at 7:27 am',
    timestamp: 1716625623,
  },
  {
    kind: 'activity',
    id: 'a5',
    type: 'assign',
    actor: 'Sam',
    text: 'Sam removed assignee: Sam',
    time: 'May 25 at 7:44 am',
    timestamp: 1716626640,
  },
  {
    kind: 'activity',
    id: 'a6',
    type: 'assign',
    actor: 'Sam',
    text: 'Sam assigned to: You',
    time: 'May 25 at 7:44 am',
    timestamp: 1716626641,
  },
  {
    kind: 'activity',
    id: 'a7',
    type: 'update',
    actor: 'Sam',
    text: 'Sam added follower: You',
    time: 'May 25 at 7:44 am',
    timestamp: 1716626642,
  },
  {
    kind: 'activity',
    id: 'a8',
    type: 'update',
    actor: 'Sam',
    text: 'Sam added John Arnel Palma to Requestor',
    time: 'May 25 at 7:44 am',
    timestamp: 1716626643,
  },
  {
    kind: 'comment',
    id: 'c2',
    entryNo: 1002,
    author: 'Sam',
    initials: 'SA',
    avatarColor: '#4a90d9',
    text: 'On backlog for @John Arnel Palma when we rejoin on 1st June.',
    time: 'May 25 at 7:45 am',
    timestamp: 1716626700,
    replies: [],
  },
  {
    kind: 'activity',
    id: 'a9',
    type: 'system',
    actor: 'ClickBot (Automations)',
    text: 'FYI: Phone numbers dropping off contacts in BCs is planned to be completed this week. @John Arnel Palma, you can track the progress of this task on the activity log.',
    time: 'Jun 8 at 10:00 am',
    timestamp: 1717833600,
  },
  {
    kind: 'activity',
    id: 'a10',
    type: 'update',
    actor: 'Sam',
    text: 'Sam changed Internal Dept Owner from BC to Development',
    time: 'Jun 2 at 6:07 am',
    timestamp: 1717301220,
  },
  {
    kind: 'comment',
    id: 'c3',
    entryNo: 1003,
    author: 'Sam',
    initials: 'SA',
    avatarColor: '#4a90d9',
    text: 'Log attached for reference.\n@John Arnel Palma',
    time: 'Jun 2 at 8:09 am',
    timestamp: 1717309740,
    replies: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mentionify(text: string) {
  return text.split(/(@[\w][\w\s]*[\w]|@[\w]+)/g).map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} style={{ color: '#4a90d9', fontWeight: 500 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  size = 'md',
}: {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims: Record<string, number> = { sm: 28, md: 34, lg: 38 };
  const fonts: Record<string, number> = { sm: 11, md: 13, lg: 14 };
  const dim = dims[size];
  const fs = fonts[size];
  return (
    <div
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: fs,
        letterSpacing: 0.3,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}

function BotAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 28 : 34;
  return (
    <div
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        borderRadius: '50%',
        background: '#6b5ce7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size === 'sm' ? 13 : 16,
        userSelect: 'none',
      }}
    >
      ⚡
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityEntry['type'] }) {
  const icons: Record<string, string> = {
    update: '📝',
    assign: '👤',
    system: '🤖',
    due: '📅',
    status: '🔄',
  };
  return <span style={{ fontSize: 12 }}>{icons[type] ?? '•'}</span>;
}

// ─── Thread Pane ──────────────────────────────────────────────────────────────

function ThreadPane({
  entry,
  onClose,
  onAddReply,
}: {
  entry: CommentEntry;
  onClose: () => void;
  onAddReply: (commentId: string, text: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 120);
  }, []);

  // scroll to bottom when replies change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [entry.replies.length]);

  const submit = () => {
    const t = replyText.trim();
    if (!t) return;
    onAddReply(entry.id, t);
    setReplyText('');
  };

  const followers = entry.replies.length + 2; // author + 1 extra = illustrative

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#f7f8fa',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.18s ease',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e8eaed',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #f0f2f5',
          flexShrink: 0,
          background: '#fff',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            color: '#6b7280',
            fontWeight: 500,
            padding: '3px 6px',
            borderRadius: 6,
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Avatar initials={entry.initials} color={entry.avatarColor} size="sm" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>
              Thread by {entry.author}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#9ca3b0', whiteSpace: 'nowrap' }}>
          {followers} followers
        </div>
      </div>

      {/* Thread body — scrollable */}
      <div
        ref={bodyRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: '#fff',
        }}
      >
        {/* Parent comment */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar initials={entry.initials} color={entry.avatarColor} size="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1a2e' }}>{entry.author}</span>
              <span style={{ fontSize: 11.5, color: '#9ca3b0' }}>{entry.time}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
              {mentionify(entry.text)}
            </p>
            {/* Reaction row */}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button style={reactionBtn}>👍</button>
              <button style={reactionBtn}>😄</button>
            </div>
          </div>
        </div>

        {/* Divider with reply count */}
        {entry.replies.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9ca3b0', whiteSpace: 'nowrap' }}>
              {entry.replies.length} {entry.replies.length === 1 ? 'reply' : 'replies'}
            </span>
            <div style={{ flex: 1, height: 1, background: '#f0f2f5' }} />
          </div>
        )}

        {/* Replies */}
        {entry.replies.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 10 }}>
            <Avatar initials={r.initials} color={r.avatarColor} size="md" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1a2e' }}>{r.author}</span>
                <span style={{ fontSize: 11.5, color: '#9ca3b0' }}>{r.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
                {mentionify(r.text)}
              </p>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button style={reactionBtn}>👍</button>
                <button style={reactionBtn}>😄</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input — pinned to bottom */}
      <div
        style={{
          borderTop: '1px solid #f0f2f5',
          padding: '10px 14px',
          flexShrink: 0,
          background: '#fff',
        }}
      >
        {/* Toolbar row (decorative, matches screenshot) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginBottom: 6,
            flexWrap: 'wrap',
          }}
        >
          {['＋', '🔗', '📎', '@', '😊', '▷', '⊕', '⋯', '✔', 'Ω'].map((icon, i) => (
            <button
              key={i}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#9ca3b0',
                padding: '2px 5px',
                borderRadius: 4,
                lineHeight: 1,
              }}
            >
              {icon}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#c4c9d4' }}>2</span>
          <button
            onClick={submit}
            disabled={!replyText.trim()}
            style={{
              background: replyText.trim() ? '#4a90d9' : '#e5e7eb',
              border: 'none',
              borderRadius: 6,
              width: 28,
              height: 28,
              cursor: replyText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: replyText.trim() ? '#fff' : '#b0b8c4',
              fontSize: 14,
              transition: 'background 0.15s',
              marginLeft: 4,
            }}
          >
            ▷
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Reply to comment…"
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            if (e.key === 'Escape') onClose();
          }}
          style={{
            width: '100%',
            resize: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 13.5,
            fontFamily: 'inherit',
            color: '#374151',
            lineHeight: 1.55,
            background: 'transparent',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}

const reactionBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e8eaed',
  borderRadius: 12,
  padding: '2px 8px',
  fontSize: 13,
  cursor: 'pointer',
  color: '#6b7280',
  lineHeight: 1.4,
};

// ─── Activity components ───────────────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const isBot =
    entry.actor.toLowerCase().includes('automation') ||
    entry.actor.toLowerCase().includes('bot') ||
    entry.actor.toLowerCase().includes('clickbot');
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isBot ? (
          <BotAvatar size="sm" />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              minWidth: 28,
              borderRadius: '50%',
              background: '#f0f4f8',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIcon type={entry.type} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, paddingTop: 3 }}>
        <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55 }}>
          {mentionify(entry.text)}
        </span>
        <span style={{ fontSize: 11, color: '#b0b8c4', marginLeft: 8, whiteSpace: 'nowrap' }}>
          {entry.time}
        </span>
      </div>
    </div>
  );
}

function ActivityGroup({ entries }: { entries: ActivityEntry[] }) {
  const [visible, setVisible] = useState(true);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: visible ? 8 : 0 }}>
        <div style={{ flex: 1, height: 1, background: '#f0f2f5' }} />
        <button
          onClick={() => setVisible(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11.5,
            color: '#9ca3b0',
            fontWeight: 500,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {visible ? '▾ Hide' : '▸ Show'} {entries.length} activit{entries.length === 1 ? 'y' : 'ies'}
        </button>
        <div style={{ flex: 1, height: 1, background: '#f0f2f5' }} />
      </div>
      {visible && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
          {entries.map(e => (
            <ActivityRow key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({
  entry,
  onOpenThread,
}: {
  entry: CommentEntry;
  onOpenThread: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8eaed',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar initials={entry.initials} color={entry.avatarColor} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1a2e' }}>{entry.author}</span>
            <span style={{ fontSize: 11.5, color: '#9ca3b0' }}>{entry.time}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
            {mentionify(entry.text)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 44 }}>
        <button style={reactionBtn}>👍</button>
        <button style={reactionBtn}>😄</button>
        <button
          onClick={() => onOpenThread(entry.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12.5,
            color: '#6b7280',
            fontWeight: 500,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {entry.replies.length > 0
            ? `${entry.replies.length} ${entry.replies.length === 1 ? 'reply' : 'replies'}`
            : 'Reply'}
        </button>
      </div>
    </div>
  );
}

// ─── New comment input ────────────────────────────────────────────────────────

function NewCommentInput({ onPost }: { onPost: (text: string) => void }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onPost(t);
    setText('');
    setFocused(false);
  };

  return (
    <div
      style={{
        border: `1.5px solid ${focused ? '#4a90d9' : '#e2e8f0'}`,
        borderRadius: 9,
        background: '#fff',
        padding: '10px 12px',
        transition: 'border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write a comment…"
        rows={focused ? 3 : 1}
        onFocus={() => setFocused(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          if (e.key === 'Escape') {
            setText('');
            setFocused(false);
            (e.target as HTMLElement).blur();
          }
        }}
        style={{
          resize: 'none',
          border: 'none',
          outline: 'none',
          width: '100%',
          fontSize: 13.5,
          fontFamily: 'inherit',
          color: '#374151',
          lineHeight: 1.55,
          background: 'transparent',
          boxSizing: 'border-box',
        }}
      />
      {focused && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => { setText(''); setFocused(false); }}
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12.5,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? '#4a90d9' : '#e5e7eb',
              color: text.trim() ? '#fff' : '#9ca3b0',
              border: 'none',
              borderRadius: 6,
              padding: '5px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'comments' | 'activity';

export default function Activity() {
  const [tab, setTab] = useState<Tab>('all');
  const [entries, setEntries] = useState<FeedEntry[]>(INITIAL_DATA);
  const [threadId, setThreadId] = useState<string | null>(null);

  const addComment = (text: string) => {
    const now = Date.now();
    const newEntry: CommentEntry = {
      kind: 'comment',
      id: `c-${now}`,
      entryNo: 9000 + Math.floor(Math.random() * 1000),
      author: 'You',
      initials: 'YO',
      avatarColor: '#10b981',
      text,
      time: 'Just now',
      timestamp: now / 1000,
      replies: [],
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const addReply = (commentId: string, text: string) => {
    setEntries(prev =>
      prev.map(e => {
        if (e.kind !== 'comment' || e.id !== commentId) return e;
        return {
          ...e,
          replies: [
            ...e.replies,
            {
              id: `r-${Date.now()}`,
              author: 'You',
              initials: 'YO',
              avatarColor: '#10b981',
              text,
              time: 'Just now',
            },
          ],
        };
      })
    );
  };

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const comments = sorted.filter((e): e is CommentEntry => e.kind === 'comment');
  const activities = sorted.filter((e): e is ActivityEntry => e.kind === 'activity');

  type FeedGroup =
    | { type: 'comment'; entry: CommentEntry }
    | { type: 'activities'; entries: ActivityEntry[] };

  const buildGroups = (items: FeedEntry[]): FeedGroup[] => {
    const groups: FeedGroup[] = [];
    let buf: ActivityEntry[] = [];
    const flush = () => { if (buf.length) { groups.push({ type: 'activities', entries: buf }); buf = []; } };
    for (const item of items) {
      if (item.kind === 'activity') buf.push(item);
      else { flush(); groups.push({ type: 'comment', entry: item }); }
    }
    flush();
    return groups;
  };

  const allGroups = buildGroups(sorted);
  const actGroups = buildGroups(activities);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'comments', label: 'Comments', count: comments.length },
    { key: 'activity', label: 'Activity', count: activities.length },
  ];

  const threadEntry = threadId
    ? (entries.find(e => e.kind === 'comment' && e.id === threadId) as CommentEntry | undefined)
    : null;

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f7f8fa',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* ── Sticky header + tabs ── */}
        <div
          style={{
            flexShrink: 0,
            background: '#f7f8fa',
            padding: '20px 20px 0',
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: '#1a1a2e', letterSpacing: -0.3 }}>
            Activity
          </h2>

          <div
            style={{
              display: 'flex',
              gap: 2,
              background: '#eff1f5',
              borderRadius: 9,
              padding: 3,
              marginBottom: 14,
              width: 'fit-content',
            }}
          >
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: tab === t.key ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: tab === t.key ? 600 : 500,
                  color: tab === t.key ? '#1a1a2e' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
                {t.count !== undefined && (
                  <span
                    style={{
                      background: tab === t.key ? '#e8f0fe' : '#e5e7eb',
                      color: tab === t.key ? '#4a90d9' : '#9ca3b0',
                      borderRadius: 10,
                      padding: '0 6px',
                      fontSize: 11,
                      fontWeight: 600,
                      minWidth: 18,
                      textAlign: 'center',
                      lineHeight: '18px',
                      display: 'inline-block',
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable feed area with thread pane overlay ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <div
            style={{
              height: '100%',
              overflowY: 'auto',
              padding: '4px 20px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxSizing: 'border-box',
              visibility: threadEntry ? 'hidden' : 'visible',
              pointerEvents: threadEntry ? 'none' : 'auto',
            }}
          >
            {tab === 'all' &&
              allGroups.map((g, i) =>
                g.type === 'comment' ? (
                  <CommentCard key={g.entry.id} entry={g.entry} onOpenThread={setThreadId} />
                ) : (
                  <ActivityGroup key={`ag-${i}`} entries={g.entries} />
                )
              )}

            {tab === 'comments' &&
              (comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3b0', fontSize: 13.5, padding: '32px 0' }}>
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map(c => <CommentCard key={c.id} entry={c} onOpenThread={setThreadId} />)
              ))}

            {tab === 'activity' &&
              (activities.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3b0', fontSize: 13.5, padding: '32px 0' }}>
                  No activity yet.
                </div>
              ) : (
                actGroups.map((g, i) =>
                  g.type === 'activities' ? (
                    <div
                      key={`actg-${i}`}
                      style={{
                        background: '#fff',
                        border: '1px solid #e8eaed',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {g.entries.map(e => (
                        <ActivityRow key={e.id} entry={e} />
                      ))}
                    </div>
                  ) : null
                )
              ))}
          </div>

          {/* Thread pane — overlays the scrollable feed only */}
          {threadEntry && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <ThreadPane
                entry={threadEntry}
                onClose={() => setThreadId(null)}
                onAddReply={addReply}
              />
            </div>
          )}
        </div>

        {/* ── Sticky comment input ── */}
        {(tab === 'all' || tab === 'comments') && (
          <div
            style={{
              flexShrink: 0,
              padding: '10px 20px 20px',
              background: '#f7f8fa',
              borderTop: '1px solid #eef0f3',
              zIndex: 10,
            }}
          >
            <NewCommentInput onPost={addComment} />
          </div>
        )}
      </div>
    </div>
  );
}