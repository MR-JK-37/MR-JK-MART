import { useState, useEffect } from 'react';
import { getAllContacts, markContactRead, deleteContact } from '../../firebase/appService';
import useToastStore from '../../store/useToastStore';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const showToast = useToastStore(s => s.show);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    const data = await getAllContacts();
    setContacts(data);
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '100px 24px 40px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      <h1 style={{ 
        color: 'white', 
        fontSize: '28px', 
        marginBottom: '24px',
        fontFamily: 'Syne, sans-serif',
      }}>
        📬 Contact Submissions ({contacts.length})
      </h1>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', 
          textAlign: 'center', padding: '60px' }}>
          Loading...
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ 
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          padding: '60px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          No submissions yet
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          {contacts.map(c => (
            <div
              key={c.id}
              onClick={async () => {
                setSelected(c);
                if (!c.read) {
                  await markContactRead(c.id);
                  loadContacts();
                }
              }}
              style={{
                padding: '16px 20px',
                background: c.read
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(124,58,237,0.12)',
                border: c.read
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(124,58,237,0.35)',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  {!c.read && (
                    <span style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: '#7c3aed',
                      flexShrink: 0,
                    }} />
                  )}
                  <span style={{ 
                    color: 'white', 
                    fontWeight: '600',
                    fontSize: '15px',
                  }}>
                    {c.name}
                  </span>
                  <span style={{ 
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '13px',
                  }}>
                    • {c.contact}
                  </span>
                </div>
                <p style={{ 
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '13px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {c.message}
                </p>
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
              }}>
                <span style={{ 
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '12px',
                }}>
                  {c.createdAt?.toDate?.()
                    ?.toLocaleDateString('en-IN') || ''}
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this message?')) {
                      await deleteContact(c.id);
                      loadContacts();
                      if (showToast) showToast('success', 'Deleted');
                    }
                  }}
                  style={{
                    background: 'rgba(248,113,113,0.15)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    padding: '4px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full message popup */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(15,12,40,0.95)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{ 
                color: 'white', 
                margin: 0,
                fontSize: '18px',
              }}>
                {selected.name}
              </h3>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '20px', cursor: 'pointer',
                }}
              >✕</button>
            </div>
            <p style={{ 
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px', marginBottom: '16px',
            }}>
              📞 {selected.contact}
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {selected.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
