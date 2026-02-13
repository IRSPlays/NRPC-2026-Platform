import { useState, useEffect } from 'react';
import { announcementsAPI } from '../../lib/api';
import { Calendar, Pin } from 'lucide-react';
import type { Announcement } from '../../types';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority: string, isPinned: boolean) => {
    if (isPinned) return 'announcement-pinned';
    switch (priority) {
      case 'high': return 'announcement-high';
      case 'medium': return 'announcement-medium';
      case 'low': return 'announcement-low';
      default: return 'announcement-medium';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-white">
          📢 Announcements
        </h2>
        <div className="grid gap-4" role="status" aria-live="polite" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-neo-surface rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-white">
          📢 Announcements
        </h2>
        <div className="p-4 bg-neo-amber/10 border border-neo-amber/30 rounded-xl text-neo-amber">
          {error}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-white">
          📢 Announcements
        </h2>
        <div className="p-8 text-center neo-glass rounded-xl border-neo-cyan/20">
          <p className="text-neo-slate/60">
            No announcements yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-heading font-bold text-white">
        📢 Announcements
      </h2>

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="neo-glass rounded-2xl border-neo-cyan/20 p-5 hover:border-neo-cyan/40 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getPriorityClass(announcement.priority, announcement.is_pinned)}`}>
                {announcement.is_pinned ? (
                  <>
                    <Pin className="w-3 h-3" />
                    PINNED
                  </>
                ) : (
                  announcement.priority.toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-neo-cyan transition-colors">
                  {announcement.title}
                </h3>
                <p className="text-neo-slate/60 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-1 mt-3 text-sm text-neo-slate/40">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(announcement.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
