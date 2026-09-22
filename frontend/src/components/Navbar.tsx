import { Wallet } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Reforma Chácara</h1>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gestão Financeira
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
