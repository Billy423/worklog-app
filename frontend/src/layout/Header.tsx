// McMaster-branded header. Maroon (#7A003C) per McMaster brand guidelines.

export function Header() {
    return (
        <header
            style={{
                background: 'var(--mcmaster-maroon)',
                color: '#fff',
                padding: '16px 20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <div
                style={{
                    maxWidth: 960,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                }}
            >
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>WorkLog</h1>
                <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                    McMaster Facility Services
                </span>
            </div>
        </header>
    );
}
