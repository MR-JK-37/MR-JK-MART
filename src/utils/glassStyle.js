export function glassStyle(isMobile) {
  return {
    background: isMobile ? 'rgba(15, 12, 40, 0.92)' : 'rgba(255,255,255,0.06)',
    backdropFilter: isMobile ? 'none' : 'blur(20px)',
    WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
  };
}
