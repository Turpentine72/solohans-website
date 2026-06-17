import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Eye, MessageSquare, X, Send, Calendar, Trash2 } from 'lucide-react';
import { contacts as contactsApi } from '../../lib/api';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await contactsApi.getAll();
      setMessages(Array.isArray(data) ? data : data.contacts || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (id) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await contactsApi.sendReply(id, replyText);
      setReplyText('');
      setSelected(null);
      fetchMessages();
    } catch (err) {
      alert('Failed to save reply');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    setDeleting(id);
    try {
      await contactsApi.delete(id);
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      alert('Failed to delete message');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.message.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Helmet><title>Contact Messages – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Contact Messages</h1>

        <div className="relative max-w-md mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or message..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading messages…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No messages yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(msg => (
              <div key={msg._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">{msg.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${msg.replied ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {msg.replied ? 'Replied' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{msg.email}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                  <Calendar size={12} />
                  {formatDate(msg.createdAt)}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{msg.message}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(msg)}
                    className="flex items-center gap-1 text-[#C62828] hover:underline text-sm">
                    <Eye size={16} /> View
                  </button>
                  {!msg.replied && (
                    <button onClick={() => setSelected(msg)}
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <MessageSquare size={16} /> Reply
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg._id)}
                    disabled={deleting === msg._id}
                    className="flex items-center gap-1 text-red-500 hover:underline text-sm ml-auto disabled:opacity-50"
                  >
                    <Trash2 size={16} /> {deleting === msg._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                {msg.reply && (
                  <div className="mt-3 bg-[#FFF8F0] p-3 rounded-lg text-sm text-gray-700">
                    <span className="font-medium">Reply:</span> {msg.reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detail/Reply Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold">Message from {selected.name}</h3>
                <button onClick={() => setSelected(null)}><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Received</p>
                  <p className="font-medium">{formatDate(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Message</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{selected.message}</p>
                </div>
                {selected.reply ? (
                  <div>
                    <p className="text-sm text-gray-500">Previous reply</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selected.reply}</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your reply</label>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl resize-none"
                      placeholder="Write your reply..."
                    />
                    <button
                      onClick={() => handleSendReply(selected._id)}
                      disabled={sending}
                      className="mt-3 flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70"
                    >
                      <Send size={18} /> {sending ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <button
                    onClick={() => handleDelete(selected._id)}
                    disabled={deleting === selected._id}
                    className="flex items-center gap-2 text-red-500 hover:underline text-sm disabled:opacity-50"
                  >
                    <Trash2 size={16} /> {deleting === selected._id ? 'Deleting…' : 'Delete this message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
