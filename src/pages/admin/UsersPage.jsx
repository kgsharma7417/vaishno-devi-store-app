import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { ShieldCheck, ShieldOff, Users, Loader2, Search } from "lucide-react";

export default function UsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("lastLoginAt", "desc"));
      const snap = await getDocs(q);
      const userList = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        // Check if this user is admin
        const adminDoc = await getDoc(doc(db, "admins", d.id));
        return {
          ...data,
          id: d.id,
          isAdmin: adminDoc.exists() && adminDoc.data().role === "admin",
        };
      }));
      setUsers(userList);
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Failed to load users." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeAdmin = async (user) => {
    setActionLoading(user.id);
    try {
      await setDoc(doc(db, "admins", user.id), { role: "admin", email: user.email, name: user.name });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: true } : u));
      addToast({ type: "success", message: `${user.name} ko Admin bana diya gaya! ✅` });
    } catch (err) {
      addToast({ type: "error", message: "Admin banane mein error aayi." });
    } finally {
      setActionLoading(null);
    }
  };

  const removeAdmin = async (user) => {
    setActionLoading(user.id);
    try {
      await deleteDoc(doc(db, "admins", user.id));
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: false } : u));
      addToast({ type: "success", message: `${user.name} ki admin access hata di gayi.` });
    } catch (err) {
      addToast({ type: "error", message: "Admin hatane mein error aayi." });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-earth-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Users Management
          </h1>
          <p className="text-earth-400 mt-1 text-sm">
            Sabhi logged-in users ki list. Yahan se aap kisi ko Admin bana sakte hain.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-earth-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Koi user nahi mila.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <div
              key={user.id}
              className={`card p-4 flex items-center gap-4 transition-all ${user.isAdmin ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : ''}`}
            >
              {/* Avatar */}
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-11 h-11 rounded-full border-2 border-earth-100 flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600 text-lg">{user.name?.[0]?.toUpperCase() || "?"}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-earth-800 text-sm truncate">{user.name}</p>
                  {user.isAdmin && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-earth-400 truncate">{user.email}</p>
                <p className="text-[10px] text-earth-300 mt-0.5">UID: {user.id?.slice(0, 16)}...</p>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {user.isAdmin ? (
                  <button
                    onClick={() => removeAdmin(user)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldOff className="w-3.5 h-3.5" />
                    )}
                    Admin Hatao
                  </button>
                ) : (
                  <button
                    onClick={() => makeAdmin(user)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Admin Banao
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
