import './globals.css';
export const metadata={title:process.env.NEXT_PUBLIC_DASHBOARD_TITLE||'Individual Companies Follow-up Status',description:'Corporate relations follow-up and process tracker'};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
