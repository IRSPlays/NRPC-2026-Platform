import { useState, useEffect } from 'react';
import { announcementsAPI, Announcement } from '../../lib/api';
import { Calendar, Pin } from 'lucide-react';

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

  const getPriorityClass = (priority: string, isPinned: number) => {
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
        <h2 className="text-2xl font-heading font-bold text-earth-mossDark dark:text-earth-stone">
          📢 Announcements
        </h2>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-earth-stone rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-earth-mossDark dark:text-earth-stone">
          📢 Announcements
        </h2>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-earth-mossDark dark:text-earth-stone">
          📢 Announcements
        </h2>
        <div className="p-8 text-center bg-earth-parchment rounded-xl border-2 border-earth-stone/30">
          <p className="text-earth-moss/60">
            No announcements yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-heading font-bold text-earth-mossDark dark:text-earth-stone">
        📢 Announcements
      </h2>

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="earth-card p-5 hover:border-earth-moss transition-colors group"
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
                <h3 className="font-heading font-bold text-lg text-earth-mossDark dark:text-earth-stone mb-2 group-hover:text-earth-terracotta transition-colors">
                  {announcement.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-1 mt-3 text-sm text-earth-moss/60">
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
