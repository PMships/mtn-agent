import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ backgroundColor: '#1A1F71' }} className="w-full px-8 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mastercard-style interlocking circles */}
          <div className="relative w-10 h-6 flex items-center">
            <div className="absolute left-0 w-6 h-6 rounded-full opacity-90" style={{ backgroundColor: '#EB001B' }} />
            <div className="absolute left-4 w-6 h-6 rounded-full opacity-80" style={{ backgroundColor: '#F79E1B' }} />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">MTN-Agent</span>
            <span className="text-xs ml-2" style={{ color: '#F79E1B' }}>Verified Agent Commerce</span>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-white hover:opacity-75 transition-opacity">Agent Console</Link>
          <Link href="/policy" className="text-white hover:opacity-75 transition-opacity">Policy</Link>
          <Link href="/audit" className="text-white hover:opacity-75 transition-opacity">Audit Log</Link>
          <Link href="/approvals" className="px-3 py-1 rounded-full text-white font-medium transition-opacity hover:opacity-75" style={{ backgroundColor: '#EB001B' }}>
            Approvals
          </Link>
        </nav>
      </div>
    </header>
  );
}