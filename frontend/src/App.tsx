// Top-level layout. Header + offline banner + placeholder content area.
// Real feature surfaces (meter picker, work-log form, admin dashboard) land
// in later issues; this is the visual frame.

import { Header } from './layout/Header';
import { OfflineBanner } from './layout/OfflineBanner';

export function App() {
    return (
        <>
            <Header />
            <OfflineBanner />
            <main
                style={{
                    maxWidth: 960,
                    margin: '0 auto',
                    padding: '24px 20px',
                }}
            >
                <section
                    style={{
                        background: '#fff',
                        border: '1px solid #e2e2e2',
                        borderRadius: 8,
                        padding: '20px',
                    }}
                >
                    <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Form goes here</h2>
                    <p style={{ margin: 0, color: '#555' }}>
                        Meter picker and work-log entry form land in a follow-up issue.
                    </p>
                </section>
            </main>
        </>
    );
}
